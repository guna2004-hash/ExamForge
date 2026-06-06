'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function PricingPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/subscriptions/checkout');
      // In a real Stripe integration, this would redirect to Stripe Checkout URL.
      // Here we mock it by redirecting to the provided success URL.
      router.push(res.data.checkout_url);
    } catch (error) {
      console.error(error);
      alert('Failed to initiate checkout.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="text-center mb-16 z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4" style={{ fontFamily: 'Outfit' }}>
          Supercharge Your Learning
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-lg">
          Upgrade to ExamForge AI Pro to unlock advanced AI capabilities, adaptive difficulty, and personalized study plans.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 max-w-5xl w-full justify-center z-10">
        
        {/* Free Tier */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 p-8 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col"
        >
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-500 mb-2">Basic Plan</h3>
            <div className="text-4xl font-extrabold dark:text-white">$0<span className="text-lg text-slate-400 font-normal">/mo</span></div>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1 text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-3">
              <span className="text-green-500 font-bold">✓</span> Generate up to 3 exams/month
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500 font-bold">✓</span> Basic AI Evaluation
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500 font-bold">✓</span> PDF Reports
            </li>
            <li className="flex items-center gap-3 opacity-50">
              <span className="text-slate-400 font-bold">✗</span> Personalized Study Plans
            </li>
            <li className="flex items-center gap-3 opacity-50">
              <span className="text-slate-400 font-bold">✗</span> RAG PDF Indexing
            </li>
          </ul>

          <button className="w-full py-3 px-6 rounded-lg font-bold border-2 border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Current Plan
          </button>
        </motion.div>

        {/* Pro Tier */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 p-8 rounded-2xl bg-gradient-to-b from-blue-900/40 to-slate-900 border border-blue-500/50 shadow-2xl shadow-blue-900/20 flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
            Most Popular
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold text-blue-400 mb-2">Pro Plan</h3>
            <div className="text-4xl font-extrabold text-white">$15<span className="text-lg text-blue-200/50 font-normal">/mo</span></div>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1 text-blue-100">
            <li className="flex items-center gap-3">
              <span className="text-blue-400 font-bold">✓</span> Unlimited AI Exams
            </li>
            <li className="flex items-center gap-3">
              <span className="text-blue-400 font-bold">✓</span> Semantic Code Evaluation
            </li>
            <li className="flex items-center gap-3">
              <span className="text-blue-400 font-bold">✓</span> AI-Generated Study Plans
            </li>
            <li className="flex items-center gap-3">
              <span className="text-blue-400 font-bold">✓</span> RAG Custom Document Indexing
            </li>
            <li className="flex items-center gap-3">
              <span className="text-blue-400 font-bold">✓</span> Priority API Processing
            </li>
          </ul>

          <button 
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg font-bold bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all flex justify-center items-center"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Upgrade to Pro'}
          </button>
        </motion.div>

      </div>
    </div>
  );
}
