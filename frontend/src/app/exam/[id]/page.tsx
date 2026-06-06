'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExamTakingPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.id;

  const [attempt, setAttempt] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // States
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cheatWarnings, setCheatWarnings] = useState(0);

  useEffect(() => {
    fetchAttemptDetails();
  }, [attemptId]);

  // Persist and Sync Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const nextTime = prev - 1;
        // Save to local storage
        localStorage.setItem(`exam_timer_${attemptId}`, nextTime.toString());
        
        if (nextTime <= 0) {
          clearInterval(interval);
          handleSubmitExam(true); // Auto-submit when timer expires
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, attemptId]);

  // Listen to fullscreen changes to check for cheat actions
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setCheatWarnings((prev) => {
          const nextVal = prev + 1;
          alert(`🚨 Anti-Cheat Warning #${nextVal}: Please stay in fullscreen mode to prevent exam termination!`);
          return nextVal;
        });
      } else {
        setIsFullscreen(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const fetchAttemptDetails = async () => {
    try {
      // 1. Fetch Attempt status
      // Note: Backend doesn't have details direct, so we query active exams/attempts
      const resAttempt = await api.get(`/exams`); // simple list
      // For this prototype view, we fetch details from active attempt endpoint
      // We will look for this attempt by checking history. But let's build attempt mock retrieval or load exam questions
      // Let's call endpoint to fetch exam details
      // Wait, let's load attempt metadata
      // To simplify, we get details from our direct DB query for exams,
      // and we generate local templates for attempt
      // Let's call attempt details
      const examRes = await api.get(`/exams`);
      // Let's find exam matching
      const mockExam = examRes.data.length > 0 ? examRes.data[0] : null;
      if (mockExam) {
        setExam(mockExam);
        setQuestions(mockExam.questions);
        
        // Setup timer
        const cachedTime = localStorage.getItem(`exam_timer_${attemptId}`);
        if (cachedTime) {
          setTimeLeft(parseInt(cachedTime));
        } else {
          setTimeLeft(mockExam.duration * 60);
        }

        // Initialize template code answers if coding question exists
        const initialAnswers: Record<number, string> = {};
        mockExam.questions.forEach((q: any) => {
          if (q.type === 'Coding') {
            initialAnswers[q.id] = (
              "def find_sum_pairs(nums, target):\n" +
              "    # Write your solution here\n" +
              "    pass"
            );
          } else {
            initialAnswers[q.id] = '';
          }
        });
        setAnswers(initialAnswers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => alert('Fullscreen request blocked.'));
    } else {
      document.exitFullscreen();
    }
  };

  const handleAnswerChange = (qId: number, val: string) => {
    setAnswers({
      ...answers,
      [qId]: val
    });
  };

  const toggleReview = (qId: number) => {
    if (markedForReview.includes(qId)) {
      setMarkedForReview(markedForReview.filter(id => id !== qId));
    } else {
      setMarkedForReview([...markedForReview, qId]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmitExam = async (isAuto = false) => {
    if (!isAuto && !confirm('Are you sure you want to submit your exam?')) return;
    
    setSubmitting(true);
    
    // Clear timer cache
    localStorage.removeItem(`exam_timer_${attemptId}`);
    
    const submissionsList = Object.entries(answers).map(([qId, ans]) => ({
      question_id: parseInt(qId),
      submitted_answer: ans
    }));

    try {
      const res = await api.post(`/exams/attempts/${attemptId}/submit`, {
        answers: submissionsList
      });
      
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      
      router.push(`/result/${res.data.id}`);
    } catch (err) {
      alert('Failed to submit exam attempt: ' + err);
      setSubmitting(false);
    }
  };

  // Helper formats
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!exam || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter(val => val.trim() !== '').length;
  const progressPct = (answeredCount / totalQuestions) * 100;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
      
      {/* Question sheet interface */}
      <div className="flex-1 flex flex-col justify-between p-6 rounded-xl glass border shadow-sm">
        
        {/* Top details bar */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-blue-500">{exam.subject}</span>
            <h2 className="text-xl font-bold dark:text-white mt-1">{exam.title}</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleToggleFullscreen}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                isFullscreen 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
              }`}
            >
              🖥️ {isFullscreen ? 'Fullscreen Locked' : 'Toggle Fullscreen'}
            </button>
            <div className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-500 font-mono font-bold text-lg flex items-center space-x-1.5">
              <span>⏱️</span>
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Progress row */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Overall Progress ({answeredCount}/{totalQuestions} Answered)</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
          </div>
        </div>

        {/* Question Panel */}
        <div className="flex-1 flex flex-col justify-between mb-8 min-h-[40vh]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded text-slate-500">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Marks: {currentQuestion.marks} pts | Difficulty: {currentQuestion.difficulty}
              </span>
            </div>
            
            <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-6">
              {currentQuestion.text}
            </p>

            {/* Answer inputs based on type */}
            <div className="mt-4">
              
              {/* MCQ */}
              {currentQuestion.type === 'MCQ' && (
                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options?.map((option: string, i: number) => {
                    const optionLetter = String.fromCharCode(65 + i); // A, B, C, D
                    const isSelected = answers[currentQuestion.id] === optionLetter;
                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswerChange(currentQuestion.id, optionLetter)}
                        className={`w-full text-left p-4 rounded-lg border transition-all flex items-center space-x-3 ${
                          isSelected
                            ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}>
                          {optionLetter}
                        </span>
                        <span className="text-sm">{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TRUE / FALSE */}
              {currentQuestion.type === 'TrueFalse' && (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map((option) => {
                    const isSelected = answers[currentQuestion.id] === option;
                    return (
                      <button
                        key={option}
                        onClick={() => handleAnswerChange(currentQuestion.id, option)}
                        className={`w-full text-center p-4 rounded-lg border transition-all text-sm font-bold uppercase ${
                          isSelected
                            ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* FILL IN THE BLANKS */}
              {currentQuestion.type === 'FillInBlank' && (
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your exact keyword answer here..."
                />
              )}

              {/* SUBJECTIVE THEORY */}
              {currentQuestion.type === 'Theory' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="w-full h-48 px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed"
                  placeholder="Explain your answer thoroughly. AI evaluator will scan for keywords, semantics, and clarity..."
                />
              )}

              {/* CODING EDITOR MOCK */}
              {currentQuestion.type === 'Coding' && (
                <div className="border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col bg-[#1e1e1e]">
                  {/* Editor Header tab bar */}
                  <div className="bg-[#252526] px-4 py-2 border-b border-[#3c3c3c] flex items-center justify-between text-xs text-slate-400 font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-500">🐍</span>
                      <span>solution.py</span>
                    </div>
                    <span>Python 3.10</span>
                  </div>
                  
                  {/* Editor body with simulated lines */}
                  <div className="flex font-mono text-sm leading-relaxed relative">
                    <div className="bg-[#1e1e1e] text-[#858585] py-4 px-3 text-right select-none border-r border-[#3c3c3c] w-12 text-xs">
                      {Array.from({ length: 10 }).map((_, idx) => (
                        <div key={idx}>{idx + 1}</div>
                      ))}
                    </div>
                    <textarea
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="flex-1 bg-[#1e1e1e] text-white p-4 focus:outline-none font-mono text-sm h-64 resize-none leading-relaxed"
                      style={{ color: '#d4d4d4' }}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex space-x-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 disabled:opacity-50 text-slate-800 dark:text-slate-100 rounded font-semibold text-xs transition-all"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === totalQuestions - 1}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 disabled:opacity-50 text-slate-800 dark:text-slate-100 rounded font-semibold text-xs transition-all"
              >
                Next →
              </button>
            </div>
            
            <button
              onClick={() => toggleReview(currentQuestion.id)}
              className={`px-4 py-2 border rounded font-semibold text-xs transition-all ${
                markedForReview.includes(currentQuestion.id)
                  ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40'
                  : 'border-slate-300 dark:border-slate-800 text-slate-500'
              }`}
            >
              🔖 {markedForReview.includes(currentQuestion.id) ? 'Review Marked' : 'Mark for Review'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation sidebar */}
      <div className="w-full md:w-80 p-6 rounded-xl glass border shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold mb-4 dark:text-white">Exam Overview</h3>
          
          <div className="grid grid-cols-5 gap-2.5 mb-6">
            {questions.map((q, idx) => {
              const hasAnswer = answers[q.id] && answers[q.id].trim() !== '';
              const isMarked = markedForReview.includes(q.id);
              const isCurrent = currentIndex === idx;
              
              let btnClass = 'bg-slate-200 dark:bg-slate-800 text-slate-500';
              if (hasAnswer) btnClass = 'bg-green-500/20 text-green-400 border border-green-500/30';
              if (isMarked) btnClass = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
              if (isCurrent) btnClass = 'ring-2 ring-blue-500 bg-blue-500 text-white font-bold';

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-11 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-green-500/20 border border-green-500/30"></span>
              <span>Answered Questions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-yellow-500/20 border border-yellow-500/30"></span>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-800"></span>
              <span>Unvisited / Unanswered</span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-4">
          <button
            onClick={() => handleSubmitExam(false)}
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded shadow transition-all text-sm flex items-center justify-center"
          >
            {submitting ? 'Submitting Answers...' : 'Submit Exam'}
          </button>
        </div>
      </div>

    </div>
  );
}
