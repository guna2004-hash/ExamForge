'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // default dark mode for premium look!

  useEffect(() => {
    initializeAuth();
    setMounted(true);
    
    // Read local storage for theme
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
      setDarkMode(false);
    } else {
      setDarkMode(true);
    }
  }, [initializeAuth]);

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('theme', newVal ? 'dark' : 'light');
  };

  if (!mounted) {
    return (
      <html lang="en">
        <body className="bg-slate-900 text-slate-100 min-h-screen">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={darkMode ? 'dark' : ''}>
      <head>
        <title>ExamForge AI - AI Online Exam Generator</title>
        <meta name="description" content="Resume-worthy enterprise AI online exam generator platform." />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-50 text-slate-950 dark:bg-darkBg dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors duration-300">
        <header className="fixed top-0 left-0 right-0 z-50 glass shadow-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent" style={{ fontFamily: 'Outfit' }}>
              EXAMFORGE AI
            </span>
            <span className="text-xs uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono font-semibold">
              AI-V2.5
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <a 
              href="http://localhost:8000/docs" 
              target="_blank" 
              rel="noreferrer" 
              className="hidden md:inline-block text-xs font-mono text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded hover:bg-slate-800 transition-all"
            >
              API Docs
            </a>
          </div>
        </header>
        <main className="flex-1 pt-20 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
