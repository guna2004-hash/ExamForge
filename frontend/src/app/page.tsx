'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-darkBg transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-36 bg-gradient-to-b from-blue-900/10 via-transparent to-transparent">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-6 relative">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto space-y-6"
          >
            <motion.div variants={itemVariants} className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-wider uppercase mb-2">
              ✨ Next-Generation AI Exam Management
            </motion.div>
            
            <motion.h1 
              variants={itemVariants} 
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white"
              style={{ fontFamily: 'Outfit' }}
            >
              Generate, Take, and Evaluate Exams using <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Advanced LLMs</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Design customizable exam questions, execute student coding submissions in sandbox environments, and utilize RAG text-extraction on notes. Built for students, teachers, and school administrators.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                Launch Platform
              </Link>
              <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-center">
                Sign Up Free
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold dark:text-white" style={{ fontFamily: 'Outfit' }}>
              Comprehensive Toolset for Modern Classrooms
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              ExamForge AI blends standard exam components with state-of-the-art AI analytics and processing pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-xl glass border shadow-sm dark:border-slate-800 hover:-translate-y-2 transition-all duration-300">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">AI generation Engine</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Generate custom MCQs, True/False, subjective essays, and programming items using specified Bloom taxonomy tiers.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="p-8 rounded-xl glass border shadow-sm dark:border-slate-800 hover:-translate-y-2 transition-all duration-300">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">Subprocess Code Sandbox</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Enables code editing. Code submissions compile and run against backend execution units, preventing security injections.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-xl glass border shadow-sm dark:border-slate-800 hover:-translate-y-2 transition-all duration-300">
              <div className="text-4xl mb-4">📂</div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">RAG Textbook Reader</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Upload notes and documents to run character splits and semantic searches, generating tests focused strictly on upload context.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-xl glass border shadow-sm dark:border-slate-800 hover:-translate-y-2 transition-all duration-300">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">Interactive Analytics</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Expose student topic weaknesses and performance scores with responsive charts, radar diagrams, and progress indicators.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-xl glass border shadow-sm dark:border-slate-800 hover:-translate-y-2 transition-all duration-300">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">XP & Achievement Badges</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Motivate student groups with automated topic badges, score multipliers, and global/topic level leaderboards.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-xl glass border shadow-sm dark:border-slate-800 hover:-translate-y-2 transition-all duration-300">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">Sleek PDF Export</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Export beautifully-styled question sheets, answer keys, and individual evaluations as printable PDF documents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold dark:text-white" style={{ fontFamily: 'Outfit' }}>
            Flexible Plans for All Settings
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Get started for free or scale to department-wide setups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-xl border dark:border-slate-800 bg-white dark:bg-darkPanel/40 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-400">Individual</h3>
              <p className="text-3xl font-extrabold mt-4 dark:text-white">$0 <span className="text-sm text-slate-500 font-normal">/ month</span></p>
              <ul className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <li>✓ Generate up to 10 exams</li>
                <li>✓ Basic question pools</li>
                <li>✓ PDF export limits</li>
              </ul>
            </div>
            <Link href="/register" className="mt-8 block text-center py-2.5 bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded font-semibold text-slate-800 dark:text-slate-100 transition-colors">
              Get Started
            </Link>
          </div>

          <div className="p-8 rounded-xl border-2 border-blue-500 bg-white dark:bg-darkPanel/60 relative flex flex-col justify-between shadow-lg">
            <span className="absolute top-0 right-6 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full">
              POPULAR
            </span>
            <div>
              <h3 className="text-lg font-bold text-blue-500">Educator Pro</h3>
              <p className="text-3xl font-extrabold mt-4 dark:text-white">$29 <span className="text-sm text-slate-500 font-normal">/ month</span></p>
              <ul className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <li>✓ Unlimited AI generation</li>
                <li>✓ Full RAG PDF uploads (100MB)</li>
                <li>✓ Safe Code sandbox execution</li>
                <li>✓ Deep analytics & PDF export</li>
              </ul>
            </div>
            <Link href="/register" className="mt-8 block text-center py-2.5 bg-blue-500 hover:bg-blue-600 rounded font-semibold text-white transition-colors">
              Try Pro Free
            </Link>
          </div>

          <div className="p-8 rounded-xl border dark:border-slate-800 bg-white dark:bg-darkPanel/40 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-400">Institution</h3>
              <p className="text-3xl font-extrabold mt-4 dark:text-white">Custom</p>
              <ul className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <li>✓ Dedicated private RAG indexes</li>
                <li>✓ Single Sign-on integration</li>
                <li>✓ Full administrator control panel</li>
                <li>✓ SLA support and API keys allocation</li>
              </ul>
            </div>
            <a href="mailto:sales@example.com" className="mt-8 block text-center py-2.5 bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded font-semibold text-slate-800 dark:text-slate-100 transition-colors">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-darkPanel/20 py-8 px-6 text-center text-slate-500 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>⚡ ExamForge AI, Inc. © 2026. All rights reserved.</div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
            <a href="http://localhost:8000/docs" className="hover:text-slate-400">Developer API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
