'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';

export default function ClassroomsPage() {
  const { user } = useAuthStore();
  const role = user?.role ?? '';
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Teacher specific state
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);

  // Student specific state
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/classrooms');
      setClassrooms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreating(true);
    try {
      await api.post('/classrooms', { name: newClassName });
      setNewClassName('');
      fetchClassrooms();
      alert('Classroom created successfully!');
    } catch (err) {
      alert('Failed to create classroom.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || joinCode.length !== 6) {
      alert('Join code must be exactly 6 characters.');
      return;
    }
    setJoining(true);
    try {
      const res = await api.post(`/classrooms/join?join_code=${joinCode.toUpperCase()}`);
      alert(res.data.detail);
      setJoinCode('');
      fetchClassrooms();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to join classroom.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white" style={{ fontFamily: 'Outfit' }}>
          My Classrooms
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {role === 'Student' 
            ? 'Join classrooms to participate in live multiplayer exams and access tailored assignments.'
            : 'Manage your student cohorts and broadcast live exams.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          {role === 'Teacher' || role === 'Admin' ? (
            <div className="p-6 rounded-xl glass border border-blue-500/30 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create New Class</h3>
              <form onSubmit={handleCreateClassroom} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Classroom Name</label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g. CS101 Fall 2026"
                    className="w-full px-3 py-2 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating || !newClassName}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold rounded shadow transition-all text-sm"
                >
                  {creating ? 'Creating...' : '+ Create Class'}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-6 rounded-xl glass border border-purple-500/30 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Join a Class</h3>
              <form onSubmit={handleJoinClassroom} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">6-Digit PIN</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="e.g. AB12CD"
                    maxLength={6}
                    className="w-full px-3 py-2 text-center tracking-widest font-mono text-lg border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={joining || joinCode.length !== 6}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-bold rounded shadow transition-all text-sm"
                >
                  {joining ? 'Verifying...' : 'Join Class'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : classrooms.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-6xl mb-4">🏫</div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Classrooms Yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {role === 'Teacher' ? 'Create your first classroom to start assigning exams.' : 'Ask your teacher for a 6-digit Join Code.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classrooms.map((cls, idx) => (
                <motion.div 
                  key={cls.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-5 rounded-xl glass border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-colors flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{cls.name}</h4>
                    {role === 'Teacher' && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-mono text-xs font-bold tracking-widest border border-slate-300 dark:border-slate-700 select-all cursor-pointer" title="Join Code">
                        {cls.join_code}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center text-sm">
                    <span className="text-slate-500">
                      👨‍🎓 {role === 'Teacher' ? `${cls.students?.length || 0} Students Enrolled` : 'Enrolled'}
                    </span>
                    <button className="text-blue-500 font-semibold hover:underline">
                      View Details →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
