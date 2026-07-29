import React, { useState, useEffect } from 'react';
import PageTransition from '../../components/PageTransition';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
export default function PremiumPage() {
  const WHY_PREMIUM = [
    { icon: 'analytics', title: 'AI Scoring', description: 'Advanced sentiment and contract analysis algorithms.' },
    { icon: 'bolt', title: 'Early Alerts', description: 'Push notifications one hour before stealth launches go live.' },
    { icon: 'shield_locked', title: 'Guaranteed Spots', description: 'Skip the queue on heavily oversubscribed public rounds.' },
  ];
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    <PageTransition className="max-w-5xl mx-auto space-y-6 pb-10 px-4 md:px-0">
      <div className="mb-8 relative z-10">
        <h1 className="text-3xl md:text-4xl font-headline-lg font-bold text-on-surface tracking-tight mt-4 mb-2">Premium Membership</h1>
        <p className="text-on-surface-variant text-sm max-w-xl">Manage your subscription and unlock exclusive early access.</p>
      </div>
      
      {subscription ? (
        <div className="p-6 sm:p-10 rounded-[2rem] glass-card border border-outline-variant space-y-4">
          <div className="flex items-center gap-3 text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">workspace_premium</span>
            <h2 className="text-2xl font-bold text-on-surface">Active</h2>
          </div>
          <p className="text-on-surface font-bold text-lg">Current plan: {subscription.plans?.name || 'Pro Tier'}</p>
          <p className="text-on-surface-variant">Status: {subscription.status}</p>
        </div>
      ) : (
        <div className="p-8 sm:p-12 border border-outline-variant rounded-[2rem] text-center glass-card relative overflow-hidden group">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/30 transition-colors duration-500"></div>
          
          <span className="material-symbols-outlined text-6xl text-primary mb-4 relative z-10 block">workspace_premium</span>
          <h2 className="text-3xl font-display-lg font-bold text-on-surface mb-4 relative z-10">Upgrade to Pro</h2>
          <p className="text-on-surface-variant max-w-lg mx-auto mb-8 relative z-10">
            Get exclusive access to upcoming launches, countdown timers, project information, and launch notifications before they become public.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10 relative z-10 text-left">
            {WHY_PREMIUM.map((item) => (
              <div key={item.title} className="glass-card hover:bg-white/5 transition-colors p-5 rounded-2xl border border-outline-variant">
                <span className="material-symbols-outlined text-primary mb-2">{item.icon}</span>
                <h4 className="text-on-surface font-bold mb-1">{item.title}</h4>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <motion.button 
            onClick={() => navigate('/pricing')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-black px-10 py-4 rounded-full font-label-mono font-bold text-sm shadow-[0_0_20px_rgba(198,198,198,0.2)] relative z-10"
          >
            View Pricing
          </motion.button>
        </div>
      )}
    </PageTransition>
  );
}