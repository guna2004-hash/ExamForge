'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [exams, setExams] = useState<any[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<any>(null);
  const [teacherAnalytics, setTeacherAnalytics] = useState<any>(null);

  // Forms
  const [subject, setSubject] = useState('Data Structures');
  const [topic, setTopic] = useState('Trees');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [duration, setDuration] = useState(30);
  const [questionTypes, setQuestionTypes] = useState<string[]>(['MCQ']);
  const [generating, setGenerating] = useState(false);

  // RAG upload
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ragGenerating, setRagGenerating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchExams();
    if (user?.role === 'Student') {
      fetchStudentAnalytics();
    } else {
      fetchTeacherAnalytics();
      fetchUploadedFiles();
    }
  }, [isAuthenticated, user?.role, router]);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudentAnalytics = async () => {
    try {
      const res = await api.get('/analytics/student');
      setStudentAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeacherAnalytics = async () => {
    try {
      const res = await api.get('/analytics/teacher');
      setTeacherAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      const res = await api.get('/rag/files');
      setUploadedFiles(res.data);
      if (res.data.length > 0) {
        setSelectedFileId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/exams/generate', {
        subject,
        topic,
        difficulty,
        num_questions: numQuestions,
        question_types: questionTypes,
        bloom_level: 'Apply',
        duration,
        language: 'English',
      });
      // Refresh
      fetchExams();
      fetchTeacherAnalytics();
      alert(`Exam "${res.data.title}" generated successfully!`);
    } catch (err) {
      alert('Error generating exam: ' + err);
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      await api.post('/rag/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('File processed and vector embeddings indexed!');
      setUploadFile(null);
      fetchUploadedFiles();
    } catch (err) {
      alert('Upload failed: ' + err);
    } finally {
      setUploading(false);
    }
  };

  const handleRAGGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileId) {
      alert('Please upload/select a document first.');
      return;
    }
    setRagGenerating(true);
    const formData = new FormData();
    formData.append('file_id', selectedFileId);
    formData.append('subject', subject);
    formData.append('topic', topic);
    formData.append('difficulty', difficulty);
    formData.append('num_questions', numQuestions.toString());
    formData.append('duration', duration.toString());
    formData.append('question_types_raw', questionTypes.join(','));

    try {
      const res = await api.post('/rag/generate-exam', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchExams();
      alert(`Context-Aware Exam "${res.data.title}" generated successfully!`);
    } catch (err) {
      alert('RAG generation failed: ' + err);
    } finally {
      setRagGenerating(false);
    }
  };

  const handleStartExam = async (examId: number) => {
    try {
      const res = await api.post(`/exams/${examId}/attempt`);
      router.push(`/exam/${res.data.id}`);
    } catch (err) {
      alert('Could not start exam attempt');
    }
  };

  const toggleQType = (type: string) => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter((t) => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 w-full">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold dark:text-white" style={{ fontFamily: 'Outfit' }}>
            System Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Welcome back, <span className="font-semibold text-blue-500">{user?.full_name}</span> ({user?.role})
          </p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold border border-red-500/30 rounded text-sm transition-all"
        >
          Sign Out
        </button>
      </div>

      {/* STUDENT DASHBOARD PANEL */}
      {user?.role === 'Student' && (
        <div className="space-y-8">
          {/* Top Cards row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl glass shadow-sm">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Tests Attempted</div>
              <div className="text-4xl font-extrabold mt-2 dark:text-white">{studentAnalytics?.total_attempts || 0}</div>
            </div>
            <div className="p-6 rounded-xl glass shadow-sm">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Avg. Score Percentage</div>
              <div className="text-4xl font-extrabold mt-2 text-blue-500">{studentAnalytics?.average_score || 0}%</div>
            </div>
            <div className="p-6 rounded-xl glass shadow-sm">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Total earned XP</div>
              <div className="text-4xl font-extrabold mt-2 text-purple-500">{studentAnalytics?.total_xp || 0} XP</div>
            </div>
            <div className="p-6 rounded-xl glass shadow-sm">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Earned Badges</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {studentAnalytics?.badges && studentAnalytics.badges.length > 0 ? (
                  studentAnalytics.badges.map((badge: string, i: number) => (
                    <span key={i} className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded font-bold">
                      🏆 {badge}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">None yet</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Chart */}
            <div className="md:col-span-2 p-6 rounded-xl glass shadow-sm flex flex-col justify-between">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Score Progress Over Time</h3>
              <div className="h-64 w-full">
                {studentAnalytics?.score_history && studentAnalytics.score_history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studentAnalytics.score_history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                      <Line type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    No completion history to plot.
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-6 rounded-xl glass shadow-sm">
              <h3 className="text-lg font-bold mb-4 dark:text-white">AI Copilot Recommendations</h3>
              <div className="space-y-4">
                {studentAnalytics?.recommendations?.map((rec: string, i: number) => (
                  <div key={i} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-blue-600 dark:text-blue-400 flex items-start space-x-2">
                    <span className="text-base mt-0.5">💡</span>
                    <span>{rec}</span>
                  </div>
                ))}
                
                {/* Weak topics lists */}
                {studentAnalytics?.weak_topics && studentAnalytics.weak_topics.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Target revision topics:</div>
                    <div className="flex flex-wrap gap-2">
                      {studentAnalytics.weak_topics.map((t: string, idx: number) => (
                        <span key={idx} className="bg-red-500/15 border border-red-500/30 text-red-500 text-xs px-2.5 py-1 rounded font-bold uppercase">
                          ⚠️ {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Exam listings */}
          <div className="p-6 rounded-xl glass shadow-sm">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Active Exam Papers</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold text-xs">
                    <th className="py-3 px-4">Exam Title</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Topic</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Marks</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {exams.length > 0 ? (
                    exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{exam.title}</td>
                        <td className="py-3.5 px-4">{exam.subject}</td>
                        <td className="py-3.5 px-4">{exam.topic}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            exam.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                            exam.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {exam.difficulty}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{exam.duration} mins</td>
                        <td className="py-3.5 px-4 font-semibold">{exam.max_marks} pts</td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleStartExam(exam.id)}
                            className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded text-xs transition-colors"
                          >
                            Start Exam
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No active exams loaded. Tell your Teacher to generate some quizzes!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER/ADMIN DASHBOARD PANEL */}
      {user?.role !== 'Student' && (
        <div className="space-y-8">
          {/* Top row cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl glass shadow-sm">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Total Exams Created</div>
              <div className="text-4xl font-extrabold mt-2 dark:text-white">{teacherAnalytics?.total_exams || 0}</div>
            </div>
            <div className="p-6 rounded-xl glass shadow-sm">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Total Student Attempts</div>
              <div className="text-4xl font-extrabold mt-2 text-purple-500">{teacherAnalytics?.total_student_attempts || 0}</div>
            </div>
            <div className="p-6 rounded-xl glass shadow-sm">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Class Average Score</div>
              <div className="text-4xl font-extrabold mt-2 text-blue-500">{teacherAnalytics?.average_class_score || 0} pts</div>
            </div>
          </div>

          {/* Setup generator and PDF upload panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Generator form */}
            <div className="p-6 rounded-xl glass shadow-sm">
              <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center space-x-2">
                <span>🤖</span> <span>LLM AI Exam generator</span>
              </h3>
              <form onSubmit={handleGenerateExam} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Q Count</label>
                    <input
                      type="number"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Duration (Min)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Question Formats</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['MCQ', 'Theory', 'Coding', 'TrueFalse', 'FillInBlank'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleQType(t)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                          questionTypes.includes(t)
                            ? 'bg-blue-500/20 text-blue-500 border-blue-500/40'
                            : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    type="submit"
                    disabled={generating}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold rounded shadow transition-all text-sm flex items-center justify-center"
                  >
                    {generating ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      'Generate with AI'
                    )}
                  </button>
                  {uploadedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRAGGenerate}
                      disabled={ragGenerating}
                      className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-bold rounded shadow transition-all text-sm flex items-center justify-center"
                      title="Generates questions using contexts of document vectors"
                    >
                      {ragGenerating ? 'Generating...' : 'RAG Generate'}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* RAG study material uploads */}
            <div className="p-6 rounded-xl glass shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2 dark:text-white flex items-center space-x-2">
                  <span>📂</span> <span>RAG Document Corpus indexer</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Upload PDF, DOCX, or text files. The server parses text chunks and saves vector indices locally.
                </p>

                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span className="text-3xl mb-1">📤</span>
                    <span className="text-xs font-semibold text-slate-400">
                      {uploadFile ? uploadFile.name : 'Select file (PDF, DOCX, TXT)'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!uploadFile || uploading}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/20 disabled:text-slate-500 text-white font-bold rounded shadow transition-all text-sm flex items-center justify-center"
                  >
                    {uploading ? 'Processing & Indexing Vector Nodes...' : 'Upload & Build Embeddings'}
                  </button>
                </form>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Active File Index</label>
                  <select
                    value={selectedFileId}
                    onChange={(e) => setSelectedFileId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {uploadedFiles.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.filename} ({f.file_type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Exam listings breakdown */}
          <div className="p-6 rounded-xl glass shadow-sm">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Active Exam Papers</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold text-xs">
                    <th className="py-3 px-4">Exam ID</th>
                    <th className="py-3 px-4">Exam Title</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Topic</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {exams.length > 0 ? (
                    exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-mono">#{exam.id}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{exam.title}</td>
                        <td className="py-3.5 px-4">{exam.subject}</td>
                        <td className="py-3.5 px-4">{exam.topic.length > 40 ? exam.topic.substring(0, 40) + '...' : exam.topic}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            exam.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                            exam.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {exam.difficulty}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{exam.duration} mins</td>
                        <td className="py-3.5 px-4 font-semibold">{exam.max_marks} pts</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No exams generated yet. Formulate options in the generator to launch your first exam.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
