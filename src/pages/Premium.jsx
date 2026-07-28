import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createCheckoutSession, getPaymentCancelUrl, getPaymentSuccessUrl } from '../lib/payments';
import PageTransition from '../components/PageTransition';
import { fetchCurrentUserProfile, hasSupabaseConfig } from '../lib/supabase';
import useAuthStore from '../store/useAuthStore';

const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    price: '$0',
    interval: '/month',
    accent: 'border-white/10',
    features: ['Browse launches', 'Countdown timers', 'Previous launches', 'Community news'],
    cta: 'Get Started',
  },
  {
    name: 'Premium',
    slug: 'premium',
    price: '$19.99',
    interval: '/month',
    accent: 'border-primary/30',
    featured: true,
    features: ['Premium reports', 'AI analysis', 'Launch research', 'Unlimited access', 'Priority notifications'],
    cta: 'Upgrade Now',
  },
  {
    name: 'Annual',
    slug: 'annual',
    price: '$199',
    interval: '/year',
    accent: 'border-purple-500/30',
    features: ['Everything in Premium', 'Best value for annual members', 'Priority support', 'Locked-in pricing'],
    cta: 'Go Annual',
  },
];

const BENEFITS = [
  {
    title: 'Clear discovery flow',
    description: 'Free users see what is already public. Premium users see the newest data and deeper context first.',
  },
  {
    title: 'Archive plus live',
    description: 'The platform is built so older launches remain searchable while new launches stay front and center.',
  },
  {
    title: 'Professional research layer',
    description: 'Premium unlocks a more serious research view that can be tied to Supabase-driven scoring and updates.',
  },
];

export default function Premium() {
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      const { profile: currentProfile, session: currentSession } = await fetchCurrentUserProfile();
      setSession(currentSession);
      if (!currentSession?.user) {
        setProfile(null);
      } else {
        setProfile(currentProfile || { access_tier: 'free', is_premium: false });
      }
      setLoadingProfile(false);
    };

    if (hasSupabaseConfig) {
      loadProfile();
    } else {
      setProfile({ access_tier: 'premium', is_premium: true });
      setLoadingProfile(false);
    }
  }, []);

  const isAuthenticated = Boolean(profile);
  const isPremium = profile?.access_tier === 'premium' || profile?.is_premium;

  const handleCheckout = async (plan) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (isPremium) {
      window.location.href = '/dashboard/user/premium';
      return;
    }

    const { url, sessionUrl, checkoutUrl } = await createCheckoutSession({
      planSlug: plan.slug,
      successUrl: getPaymentSuccessUrl(),
      cancelUrl: getPaymentCancelUrl(),
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    window.location.href = url || sessionUrl || checkoutUrl;
  };

  return (
    <PageTransition className="px-6 md:px-margin-desktop py-24 min-h-screen relative animate-in fade-in duration-300 overflow-hidden">
    
      <div className="max-w-6xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 font-label-mono text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full text-caption border border-purple-500/20 tracking-wider">
          PREMIUM ACCESS
        </span>
        <h1 className="font-display-lg text-4xl md:text-6xl text-white font-bold tracking-tight mt-6 mb-4">
          Free browsing. Premium intelligence.
        </h1>
        <p className="text-on-surface-variant font-body-lg leading-relaxed max-w-3xl mx-auto mb-14">
          TradePad separates public discovery from deeper launch intelligence. Free gives you the board and archive. Premium unlocks checkout-backed access to launch research and premium reports.
        </p>

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 text-left mb-10 ${!isAuthenticated ? 'opacity-90' : ''}`}>
          {PLANS.map((plan) => (
            <div key={plan.name} className={`glass-card rounded-[2rem] p-8 border ${plan.accent} relative overflow-hidden`}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="font-label-mono text-[11px] text-on-surface-variant uppercase tracking-wider">{plan.slug === 'free' ? 'Starter access' : 'Paid access'}</span>
                <span className="text-[10px] font-label-mono px-2.5 py-1 rounded-full border text-on-surface-variant border-white/10 bg-white/5">
                  {plan.name}
                </span>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <h2 className="text-5xl font-bold font-display-lg text-white">{plan.price}</h2>
                <span className="text-on-surface-variant font-label-mono text-caption mb-2">{plan.interval}</span>
              </div>
              <div className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-[14px] text-white">
                    <span className="material-symbols-outlined text-[18px] text-green-400">check_circle</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              {plan.slug === 'free' ? (
                <Link to="/" className="block w-full text-center py-4 rounded-xl font-label-mono font-bold text-[13px] border border-white/10 hover:bg-white/5 text-white">
                  {plan.cta}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCheckout(plan)}
                  className={`w-full py-4 rounded-xl font-label-mono font-bold text-[13px] transition-all text-center active:scale-95 ${
                    plan.featured
                      ? 'bg-primary text-black hover:opacity-90'
                      : 'border border-white/10 hover:bg-white/5 text-white'
                  }`}
                >
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {BENEFITS.map((benefit, index) => (
            <div
              key={benefit.title}
              className="glass-card rounded-3xl p-6 border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <h3 className="text-white font-bold text-lg mb-3">{benefit.title}</h3>
              <p className="text-on-surface-variant text-[14px] leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </section>
      </div>
    </PageTransition>
  );
}
