'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '../../../services/api';

export default function PricingSuccessPage() {
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(true);

  useEffect(() => {
    const confirmWebhook = async () => {
      try {
        // Simulate Stripe webhook arriving at the backend
        await api.post('/subscriptions/webhook-mock');
        setUpgrading(false);
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (err) {
        console.error(err);
      }
    };
    confirmWebhook();
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950 px-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-6"
      >
        {upgrading ? (
          <>
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-2xl font-bold text-white">Confirming Payment...</h2>
            <p className="text-slate-400">Please wait while we verify your transaction with Stripe.</p>
          </>
        ) : (
          <>
            <div className="w-24 h-24 bg-green-500/20 border border-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl text-green-500">✓</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white" style={{ fontFamily: 'Outfit' }}>Payment Successful!</h2>
            <p className="text-slate-300 max-w-md mx-auto">
              Welcome to ExamForge AI Pro. Your account has been upgraded and premium features are now unlocked.
            </p>
            <p className="text-sm text-slate-500">Redirecting to your dashboard...</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
