import React, { useState, useEffect } from 'react';
import PageTransition from '../../components/PageTransition';
import { motion } from 'framer-motion';

export default function PremiumPage() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const fetchSub = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Simulate no active subscription for demonstration
      setSubscription(null);
      
      setLoading(false);
    };

    fetchSub();
  }, []);

  if (loading) {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display-lg font-bold text-white mb-2">Premium Access</h1>
          <p className="text-on-surface-variant text-sm">Manage your subscription and unlock exclusive early access.</p>
        </div>
      </div>
      
      {subscription ? (
        <div className="glass-card p-8 border-white/5 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">workspace_premium</span>
            <h2 className="text-2xl font-bold">Active</h2>
          </div>
          <p className="text-white font-bold text-lg">Current plan: {subscription.plans?.name || 'Pro Tier'}</p>
          <p className="text-on-surface-variant">Status: {subscription.status}</p>
        </div>
      ) : (
        <div className="glass-card p-10 border-primary/20 rounded-3xl text-center bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
          
          <span className="material-symbols-outlined text-6xl text-primary mb-4 relative z-10 block">workspace_premium</span>
          <h2 className="text-3xl font-display-lg font-bold text-white mb-4 relative z-10">Upgrade to Pro</h2>
          <p className="text-on-surface-variant max-w-lg mx-auto mb-8 relative z-10">
            Get exclusive access to upcoming launches, countdown timers, project information, and launch notifications before they become public.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10 relative z-10 text-left">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
              <span className="material-symbols-outlined text-primary mb-2">visibility</span>
              <h4 className="text-white font-bold mb-1">Early Access</h4>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">Know exactly what's launching next before the public finds out.</p>
            </div>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
              <span className="material-symbols-outlined text-primary mb-2">notifications_active</span>
              <h4 className="text-white font-bold mb-1">Live Notifications</h4>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">Instant push alerts so you never miss a critical countdown.</p>
            </div>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
              <span className="material-symbols-outlined text-primary mb-2">shield_locked</span>
              <h4 className="text-white font-bold mb-1">Guaranteed Spots</h4>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">Skip the queue on heavily oversubscribed public rounds.</p>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-black px-10 py-4 rounded-full font-label-mono font-bold text-sm shadow-[0_0_20px_rgba(198,198,198,0.2)] relative z-10"
          >
            Start 7-Day Free Trial
          </motion.button>
        </div>
      )}
    </PageTransition>
  );
}