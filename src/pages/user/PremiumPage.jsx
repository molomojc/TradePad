import React, { useState, useEffect } from 'react';
import PageTransition from '../../components/PageTransition';
import Panel from '../../components/Panel';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchCurrentAccess, hasSupabaseConfig, supabase } from '../../lib/supabase';

const MEMBER_INCLUDES = [
  'Access to every upcoming IPO launch',
  'View launch dates and live countdowns',
  'See how many members have joined each launch',
  'Receive launch announcements before the public',
  'Priority platform updates',
  'Access to the Upcoming Launch dashboard',
];

const LOCKED_BENEFITS = [
  'View the next IPO launch date',
  'Live countdown until launch',
  'See member registration numbers',
  'Receive exclusive announcements',
  'Priority launch notifications',
  'Full access to the Upcoming Launch dashboard',
];

const WHY_PREMIUM = [
  { icon: 'analytics', title: 'AI Scoring', description: 'Advanced sentiment and contract analysis algorithms.' },
  { icon: 'bolt', title: 'Early Alerts', description: 'Push notifications one hour before stealth launches go live.' },
  { icon: 'shield_locked', title: 'Guaranteed Spots', description: 'Skip the queue on heavily oversubscribed public rounds.' },
];

const QUICK_ACTIONS = [
  { icon: 'calendar_month', label: 'Launch Calendar', to: '/calendar' },
  { icon: 'person', label: 'Manage Subscription', to: '/account/subscription' },
  { icon: 'settings', label: 'Account Settings', to: '/account/settings' },
];

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function StatusBadge({ isPremium }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-label-mono text-[11px] tracking-wider uppercase ${
        isPremium ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/15 text-on-surface-variant'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isPremium ? 'bg-primary animate-pulse' : 'bg-white/30'}`} />
      {isPremium ? 'Premium Member' : 'Free Member'}
    </span>
  );
}

export default function PremiumPage() {
  const [subscription, setSubscription] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isPremiumMember = profile?.access_tier === 'premium' || profile?.is_premium || profile?.role === 'admin';

  useEffect(() => {
    const fetchSub = async () => {
      setLoading(true);
      if (hasSupabaseConfig && supabase) {
        const { profile: currentProfile, isPremium } = await fetchCurrentAccess();
        setProfile({
          ...currentProfile,
          access_tier: isPremium ? 'premium' : currentProfile?.access_tier || 'free',
          is_premium: isPremium,
        });
        setSubscription(isPremium ? { status: 'active', plans: { name: 'Premium' } } : null);
      } else {
        setProfile({ access_tier: 'premium', is_premium: true });
        setSubscription({ status: 'active', plans: { name: 'Premium' } });
      }

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

  const statusRows = [
    ['Plan', subscription?.plans?.name || 'Premium'],
    ['Status', capitalize(subscription?.status) || 'Active'],
    ['Renewal', subscription?.current_period_end || 'Not available'],
    ['Access Level', profile?.role === 'admin' ? 'Administrator' : 'Premium Member'],
  ];

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-6 pb-10">

      {isPremiumMember ? (
        <>
          {/* Header */}
          <div className="mb-8 relative z-10">
            <StatusBadge isPremium />
            <h1 className="text-4xl font-headline-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-red to-primary tracking-tight mt-4 mb-2">Premium Membership</h1>
            <p className="text-on-surface-variant text-sm max-w-xl">
              You're a Premium member with full access to all exclusive MemLaunch features.
            </p>
          </div>

          {/* Primary CTA */}
          <Link to="/launch" className="block">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center justify-between gap-4 bg-primary text-black rounded-lg px-6 sm:px-8 py-5 font-label-mono font-bold text-sm cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                Go to Upcoming Launch
              </span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </motion.div>
          </Link>

          {/* Membership includes */}
          <Panel className="p-8 sm:p-10 rounded-[2rem] glass-card border border-white/5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-primary/10 bg-[#0a0a0a]/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
            <span className="font-label-mono text-[11px] text-on-surface-variant tracking-wider uppercase block mb-6 relative z-10">
              Your Membership Includes
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {MEMBER_INCLUDES.map((item) => (
                <div key={item} className="flex items-start gap-3 text-white text-sm">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
                  {item}
                </div>
              ))}
            </div>
          </Panel>

          {/* Membership status */}
          <Panel className="p-8 sm:p-10 rounded-[2rem] glass-card border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-lg bg-[#0a0a0a]/50 relative overflow-hidden">
            <span className="font-label-mono text-[11px] text-on-surface-variant tracking-wider uppercase block mb-5 relative z-10">
              Membership Status
            </span>
            <div className="divide-y divide-white/10 font-label-mono text-[13px]">
              {statusRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <span className="text-on-surface-variant tracking-wide uppercase text-[11px]">{label}</span>
                  <span className="text-white font-bold">{value}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Quick actions */}
          <div>
            <span className="font-label-mono text-[11px] text-on-surface-variant tracking-wider uppercase block mb-3">
              Quick Actions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {QUICK_ACTIONS.map((action) => (
                <Panel
                  key={action.label}
                  as={Link}
                  to={action.to}
                  className="p-6 flex items-center gap-3 cursor-pointer rounded-2xl glass-card border border-white/5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-primary/10 bg-[#0a0a0a]/50 group"
                >
                  <span className="material-symbols-outlined text-primary text-[20px] group-hover:scale-110 transition-transform">{action.icon}</span>
                  <span className="text-white text-sm font-bold">{action.label}</span>
                </Panel>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Header */}
          <div className="mb-8 relative z-10">
            <StatusBadge isPremium={false} />
            <h1 className="text-4xl font-headline-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-red to-primary tracking-tight mt-4 mb-2">Unlock Premium Access</h1>
            <p className="text-on-surface-variant text-sm max-w-xl">
              Become a Premium member to access exclusive IPO launch information before it's available to everyone
              else.
            </p>
          </div>

          {/* Locked benefits */}
          <Panel className="p-8 sm:p-10 rounded-[2rem] glass-card border border-neon-red/10 hover:border-neon-red/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-neon-red/10 bg-[#0a0a0a]/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-red/5 rounded-full blur-[50px] group-hover:bg-neon-red/10 transition-colors pointer-events-none"></div>
            <span className="font-label-mono text-[11px] text-on-surface-variant tracking-wider uppercase block mb-6 relative z-10">
              Premium Benefits
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {LOCKED_BENEFITS.map((item) => (
                <div key={item} className="flex items-start gap-3 text-on-surface-variant/70 text-sm">
                  <span className="material-symbols-outlined text-white/30 text-[18px] shrink-0 mt-0.5">lock</span>
                  {item}
                </div>
              ))}
            </div>
          </Panel>

          {/* Why premium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHY_PREMIUM.map((item) => (
              <Panel key={item.title} className="p-6 rounded-2xl glass-card border border-white/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 bg-[#0a0a0a]/40 group shadow-lg">
                <span className="material-symbols-outlined text-primary mb-3 block group-hover:scale-110 transition-transform">{item.icon}</span>
                <h4 className="text-white font-bold mb-1 text-sm">{item.title}</h4>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">{item.description}</p>
              </Panel>
            ))}
          </div>

          {/* Pricing */}
          <Panel className="p-10 sm:p-12 text-center bg-gradient-to-b from-[#0a0a0a]/80 to-[#0a0a0a]/40 relative overflow-hidden rounded-[2rem] border border-neon-red/20 hover:border-neon-red/40 transition-all duration-500 shadow-xl shadow-neon-red/5 mt-8 group">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 bg-neon-red/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-neon-red/20 transition-colors"></div>

            <span className="material-symbols-outlined text-6xl text-neon-red mb-6 relative z-10 block group-hover:scale-110 transition-transform duration-500">
              workspace_premium
            </span>
            <p className="font-label-mono text-[11px] text-on-surface-variant tracking-wider uppercase relative z-10 mb-1">
              Premium Membership
            </p>
            <p className="text-white text-4xl font-bold relative z-10 mb-1">
              $19<span className="text-on-surface-variant text-base font-normal">/month</span>
            </p>
            <p className="text-on-surface-variant text-[13px] relative z-10 mb-8">Cancel anytime.</p>

            <Link to="/pricing" className="inline-flex relative z-10">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-neon-red text-white px-10 py-4 rounded-full font-label-mono font-bold text-sm shadow-[0_0_20px_rgba(255,46,46,0.3)] hover:shadow-[0_0_30px_rgba(255,46,46,0.5)] transition-shadow"
              >
                Upgrade to Premium
              </motion.button>
            </Link>
          </Panel>
        </>
      )}
    </PageTransition>
  );
}