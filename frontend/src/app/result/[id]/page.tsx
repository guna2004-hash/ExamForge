'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../services/api';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { exportToPDF } from '../../../utils/pdfExport';

export default function ExamResultPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.id;

  const [attempt, setAttempt] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    fetchResultDetails();
  }, [attemptId]);

  const fetchResultDetails = async () => {
    try {
      const examRes = await api.get('/exams');
      const mockExam = examRes.data.length > 0 ? examRes.data[0] : null;

      if (mockExam) {
        setExam(mockExam);
        setQuestions(mockExam.questions);

        // Fetch custom scores from DB or simulate
        const mockAttempt = {
          id: attemptId,
          score: Math.round(mockExam.max_marks * 0.8),
          feedback: "Outstanding work! You demonstrated complete mastery of core topics. Revisit indexing arrays for edge cases.",
          submitted_at: new Date().toLocaleDateString(),
          evaluation_report: {
            breakdown: mockExam.questions.reduce((acc: any, q: any, idx: number) => {
              const isCorrect = idx % 3 !== 0; // Simulate 1 incorrect out of 3
              acc[q.id.toString()] = {
                type: q.type,
                max_marks: q.marks,
                score: isCorrect ? q.marks : 0.0,
                is_correct: isCorrect,
                feedback: q.type === 'Coding' 
                  ? "Execution status: Success. Test cases passed: 3/3."
                  : q.type === 'Theory' 
                  ? "The answer is structurally sound. You successfully covered horizontal scaling schemas, though you omitted horizontal partitioning details."
                  : null
              };
              return acc;
            }, {})
          }
        };

        setAttempt(mockAttempt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    await exportToPDF('pdf-content', `${exam.title.replace(/\s+/g, '_')}_Report.pdf`, setExportingPDF);
  };

  if (loading || !exam || !attempt) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const scorePct = Math.round((attempt.score / exam.max_marks) * 100);

  return (
    <div id="pdf-content" className="max-w-4xl mx-auto px-6 py-8 w-full space-y-8 bg-white dark:bg-slate-950 rounded-xl">
      
      {/* Top Banner Result Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 rounded-xl glass border shadow-lg text-center relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <span className="text-sm uppercase tracking-wider font-bold text-blue-400">Exam Evaluation Report</span>
        <h1 className="text-3xl font-extrabold dark:text-white mt-1" style={{ fontFamily: 'Outfit' }}>{exam.title}</h1>
        
        {/* Score Ring */}
        <div className="my-8 flex justify-center">
          <div className="w-36 h-36 rounded-full border-8 border-slate-700 flex flex-col items-center justify-center relative bg-slate-900/50">
            <span className="text-4xl font-extrabold text-blue-500">{scorePct}%</span>
            <span className="text-xs text-slate-400 uppercase mt-0.5">{attempt.score} / {exam.max_marks} Pts</span>
          </div>
        </div>

        <p className="text-base text-slate-700 dark:text-slate-300 max-w-xl mx-auto font-medium">
          "{attempt.feedback}"
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={exportingPDF}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-bold rounded shadow transition-colors text-sm"
          >
            {exportingPDF ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded transition-colors text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Questions Review Breakdown */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold dark:text-white" style={{ fontFamily: 'Outfit' }}>
          Detailed Review & Explanations
        </h2>

        {questions.map((q, idx) => {
          const evalItem = attempt.evaluation_report?.breakdown[q.id.toString()] || {};
          const isCorrect = evalItem.is_correct;
          const scoreEarned = evalItem.score;

          return (
            <div
              key={q.id}
              className={`p-6 rounded-xl border transition-all ${
                isCorrect 
                  ? 'border-green-500/20 bg-green-500/5 dark:bg-green-950/5' 
                  : 'border-red-500/20 bg-red-500/5 dark:bg-red-950/5'
              }`}
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400">Question {idx + 1} ({q.type})</span>
                  <h3 className="text-base font-bold dark:text-white mt-1">{q.text}</h3>
                </div>
                
                <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                  isCorrect 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {isCorrect ? 'Correct' : 'Incorrect'} ({scoreEarned} / {q.marks} pts)
                </span>
              </div>

              {/* Solution display */}
              <div className="space-y-3 mt-4 text-sm pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                
                {/* Correct answer text */}
                <div className="text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Expected:</span> {q.correct_answer}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Explanation:</span> {q.explanation}
                  </div>
                )}

                {/* AI semantic feedback / compile output log */}
                {evalItem.feedback && (
                  <div className="p-3.5 bg-slate-900/60 rounded border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                    <div className="font-bold text-blue-400 uppercase tracking-wider">🔬 Grading Assessment:</div>
                    <div>{evalItem.feedback}</div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
