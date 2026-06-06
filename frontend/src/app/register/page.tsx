'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/register', {
        email,
        full_name: fullName,
        password,
        role,
      });

      setSuccess('Account created successfully! Redirecting to login page...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Registration failed. Please check your inputs.'
      );
      setLoading(false);
    }
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
          Create Account
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
          Register to generate exams or start taking tests
        </p>

        {success && (
          <div className="p-3 mb-4 rounded bg-green-500/10 border border-green-500/30 text-green-500 text-sm font-semibold">
            🎉 {success}
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-semibold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold mb-1.5 text-slate-500 dark:text-slate-400">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              placeholder="e.g. Jane Doe"
            />
          </div>

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
              placeholder="e.g. jane@example.com"
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
              placeholder="•••••••• (Min 8 characters)"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-bold mb-1.5 text-slate-500 dark:text-slate-400">
              Your Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('Student')}
                className={`py-2 text-sm font-semibold border rounded transition-all ${
                  role === 'Student'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('Teacher')}
                className={`py-2 text-sm font-semibold border rounded transition-all ${
                  role === 'Teacher'
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Teacher
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded shadow hover:shadow-lg transition-all duration-300 flex items-center justify-center text-sm"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-500 hover:underline font-bold">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
