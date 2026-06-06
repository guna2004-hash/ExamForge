'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../../services/api';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';

export default function StudyPlanPage() {
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const role = useAuthStore(state => state.user?.role ?? '');

  const generatePlan = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/study-plans/generate');
      setStudyPlan(res.data.study_plan);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate study plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white" style={{ fontFamily: 'Outfit' }}>
            AI Study Plan
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Personalized syllabus generated from your past exam performance.
          </p>
        </div>
        
        {role === 'Student' && (
          <button 
            onClick={generatePlan}
            disabled={loading}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow transition-all flex items-center space-x-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block"></span>
            ) : (
              <span>✨ Generate New Plan</span>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 mb-8 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 font-semibold flex flex-col md:flex-row md:items-center justify-between">
          <span>⚠️ {error}</span>
          {error.includes("Pro feature") && (
            <Link href="/pricing" className="mt-3 md:mt-0 px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors">
              Upgrade to Pro
            </Link>
          )}
        </div>
      )}

      {loading && !studyPlan && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-mono animate-pulse">Analyzing past exams & building syllabus...</p>
        </div>
      )}

      {studyPlan && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-100">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <span>🎯</span> AI Assessment Overview
            </h3>
            <p className="leading-relaxed opacity-90">{studyPlan.overview}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {studyPlan.days.map((dayObj: any, index: number) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-5 rounded-xl glass border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Day {dayObj.day}
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4 line-clamp-2">
                  {dayObj.topic}
                </h4>
                
                <ul className="space-y-2.5">
                  {dayObj.tasks.map((task: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span className="leading-tight">{task}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {!studyPlan && !loading && !error && (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Study Plan Active</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Click "Generate New Plan" to have our AI analyze your recent exam history and build a custom syllabus.
          </p>
        </div>
      )}
    </div>
  );
}
