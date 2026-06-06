'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../../store/authStore';
import api from '../../../../services/api';

export default function LiveExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<{ user_name: string; score: number }[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchExam();
    connectWebSocket();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [id]);

  const fetchExam = async () => {
    try {
      const res = await api.get(`/exams/${id}`);
      setExam(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load exam details.');
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    // Determine WS protocol based on current protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the backend host mapping. Assuming backend runs on 8000 locally
    const wsUrl = `${protocol}//localhost:8000/ws/live-exam/${id}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Connected to Live Exam Room:', id);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'score_update') {
          handleScoreUpdate(data.user_name, data.score);
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    ws.current.onclose = () => {
      console.log('Disconnected from Live Exam Room');
    };
  };

  const handleScoreUpdate = (userName: string, score: number) => {
    setScores((prev) => {
      // Check if user already exists
      const existingIdx = prev.findIndex(s => s.user_name === userName);
      if (existingIdx >= 0) {
        const newScores = [...prev];
        newScores[existingIdx] = { user_name: userName, score };
        return newScores.sort((a, b) => b.score - a.score);
      }
      return [...prev, { user_name: userName, score }].sort((a, b) => b.score - a.score);
    });
  };

  const startAttempt = async () => {
    try {
      const res = await api.post(`/exams/${id}/attempt`);
      router.push(`/exam/${res.data.id}`);
    } catch (err) {
      alert('Could not start live attempt');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-900 text-white min-h-screen">
      
      {/* Main Exam Stage Panel */}
      <div className="flex-1 p-8 flex flex-col justify-center items-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center z-10 max-w-2xl w-full p-10 rounded-3xl glass border border-white/10 shadow-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-bold tracking-widest uppercase mb-6 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Live Room
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ fontFamily: 'Outfit' }}>
            {exam?.title}
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            {exam?.subject} • {exam?.topic} • {exam?.duration} Mins
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10 text-left">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="text-xs uppercase text-slate-500 font-bold mb-1">Max Marks</div>
              <div className="text-2xl font-bold text-blue-400">{exam?.max_marks}</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="text-xs uppercase text-slate-500 font-bold mb-1">Total Questions</div>
              <div className="text-2xl font-bold text-purple-400">{exam?.questions?.length || 0}</div>
            </div>
          </div>

          {user?.role === 'Student' ? (
            <button 
              onClick={startAttempt}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xl rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all hover:scale-105"
            >
              Enter Arena
            </button>
          ) : (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-400">
              You are hosting this live exam. Watch the leaderboard!
            </div>
          )}
        </motion.div>
      </div>

      {/* Live Leaderboard Sidebar */}
      <div className="w-full md:w-96 bg-slate-950/80 backdrop-blur-xl border-l border-white/5 p-6 flex flex-col shadow-2xl relative z-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-mono">Leaderboard</h2>
          <span className="text-2xl">🏆</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          <AnimatePresence>
            {scores.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-slate-500 py-10"
              >
                Waiting for submissions...
              </motion.div>
            ) : (
              scores.map((s, index) => (
                <motion.div
                  key={s.user_name}
                  layout
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', bounce: 0.3 }}
                  className={`p-4 rounded-xl flex items-center justify-between border ${
                    index === 0 ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' :
                    index === 1 ? 'bg-slate-300/10 border-slate-300/30 text-slate-300' :
                    index === 2 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                    'bg-slate-800/50 border-transparent text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-lg w-6">#{index + 1}</span>
                    <span className="font-bold truncate max-w-[120px]">{s.user_name}</span>
                  </div>
                  <div className="font-black text-xl">{s.score} <span className="text-xs font-normal opacity-50">pts</span></div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
