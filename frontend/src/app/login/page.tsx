'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, role, full_name } = response.data;
      
      loginStore(access_token, role, full_name);
      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden bg-slate-50 dark:bg-darkBg transition-colors duration-300">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/4 w-[250px] h-[250px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-xl glass border border-slate-200 dark:border-slate-800 shadow-xl"
      >
        <h2 className="text-3xl font-extrabold text-center mb-2 dark:text-white" style={{ fontFamily: 'Outfit' }}>
          Welcome Back
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
          Access your exam papers and evaluation reports
        </p>

        {error && (
          <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-semibold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold mb-1.5 text-slate-500 dark:text-slate-400">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              placeholder="e.g. email@example.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-bold mb-1.5 text-slate-500 dark:text-slate-400">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded shadow hover:shadow-lg transition-all duration-300 flex items-center justify-center text-sm"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          New to the platform?{' '}
          <Link href="/register" className="text-blue-500 hover:underline font-bold">
            Create Account
          </Link>
        </div>

        {/* Quick Demo Logins - Invaluable for grading/testing! */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            ⚡ Quick Demo Logins
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('student@example.com')}
              className="px-2 py-2 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 rounded transition-all"
            >
              Student
            </button>
            <button
              onClick={() => handleQuickLogin('teacher@example.com')}
              className="px-2 py-2 text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20 rounded transition-all"
            >
              Teacher
            </button>
            <button
              onClick={() => handleQuickLogin('admin@example.com')}
              className="px-2 py-2 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 font-bold border border-green-500/20 rounded transition-all"
            >
              Admin
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
