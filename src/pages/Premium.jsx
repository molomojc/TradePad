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
    interval: 'Forever',
    accent: 'border-white/10',
    badge: 'Free Membership',
    features: [
      'Browse previous launches',
      'View completed projects',
      'Platform announcements',
      'Access community updates'
    ],
    cta: 'Start Free',
  },
  {
    name: 'Premium',
    slug: 'premium',
    price: '$19.99',
    interval: '/month',
    accent: 'border-primary/30',
    badge: 'Premium Membership',
    featured: true,
    features: [
      'See upcoming launches',
      'Live launch countdown',
      'Project overview before launch',
      'Member participation tracker',
      'Instant launch notifications',
      'Everything in Free'
    ],
    cta: 'Become Premium',
  },
  {
    name: 'Annual',
    slug: 'annual',
    price: '$199',
    interval: '/year',
    accent: 'border-purple-500/30',
    badge: 'Annual Membership',
    features: [
      'Everything in Premium',
      '2 months free',
      'Priority support',
      'Lowest annual price'
    ],
    cta: 'Go Annual',
  },
];

const BENEFITS = [
  {
    title: 'Fair Launches',
    description:
      'Every project is created and launched by the TradePad team. We do not accept public submissions or anonymous listings.',
  },
  {
    title: 'Premium Early Access',
    description:
      'Premium members can see the next launch before the public, giving them time to prepare before launch day.',
  },
  {
    title: 'Transparent Schedule',
    description:
      'Launches follow a predictable schedule so members always know when the next opportunity is approaching.',
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
      // Button is disabled, but just in case
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
          MEMBERSHIP PLANS
        </span>
        <h1 className="font-display-lg text-4xl md:text-6xl text-white font-bold tracking-tight mt-6 mb-4">
          Choose the membership<br/>that's right for you.
        </h1>
        <div className="text-on-surface-variant font-body-lg leading-relaxed max-w-3xl mx-auto mb-14 space-y-4">
          <p>TradePad is free to explore.</p>
          <p>Upgrade to Premium to unlock upcoming launches before they're announced publicly, including countdown timers, project information, launch notifications, and exclusive member-only access.</p>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 text-left mb-10 ${!isAuthenticated ? 'opacity-90' : ''}`}>
          {PLANS.map((plan) => (
            <div key={plan.name} className={`glass-card rounded-[2rem] p-8 border ${plan.accent} relative overflow-hidden flex flex-col`}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="font-label-mono text-[11px] text-on-surface-variant uppercase tracking-wider">{plan.badge}</span>
                <span className="text-[10px] font-label-mono px-2.5 py-1 rounded-full border text-on-surface-variant border-white/10 bg-white/5">
                  {plan.name}
                </span>
              </div>
              <div className="flex items-end gap-2 mb-6">
                <h2 className="text-5xl font-bold font-display-lg text-white">{plan.price}</h2>
                <span className="text-on-surface-variant font-label-mono text-caption mb-2">{plan.interval}</span>
              </div>
              <div className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-[14px] text-white">
                    <span className="material-symbols-outlined text-[18px] text-green-400 shrink-0">check_circle</span>
                    <span className="leading-snug">{feature}</span>
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
                  disabled={isPremium}
                  onClick={() => handleCheckout(plan)}
                  className={`w-full py-4 rounded-xl font-label-mono font-bold text-[13px] transition-all text-center active:scale-95 ${
                    isPremium 
                      ? 'bg-white/5 text-on-surface-variant cursor-not-allowed border border-white/10'
                      : plan.featured
                        ? 'bg-primary text-black hover:opacity-90'
                        : 'border border-white/10 hover:bg-white/5 text-white'
                  }`}
                >
                  {isPremium ? '✓ Your Current Plan' : plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-3xl p-10 mt-12 mb-16 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
          <h2 className="text-3xl font-bold font-display-lg text-white mb-6 relative z-10">
            Why Upgrade?
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-8 max-w-4xl relative z-10">
            TradePad is built around exclusive launches. While everyone can browse previous launches for free, Premium members gain access to upcoming projects before they are announced publicly.
          </p>
          
          <div className="grid md:grid-cols-2 gap-10 relative z-10">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-white/50 text-[20px]">explore</span>
                Free Members
              </h3>
              <ul className="space-y-3 text-on-surface-variant text-sm">
                <li className="flex items-center gap-2"><span className="text-white/40">✔</span> Browse completed launches</li>
                <li className="flex items-center gap-2"><span className="text-white/40">✔</span> View previous projects</li>
                <li className="flex items-center gap-2"><span className="text-white/40">✔</span> Read platform announcements</li>
                <li className="flex items-center gap-2"><span className="text-white/40">✔</span> Upgrade anytime</li>
              </ul>
            </div>
            
            <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
              <h3 className="text-primary font-bold mb-4 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                Premium Members
              </h3>
              <ul className="space-y-3 text-white text-sm relative z-10">
                <li className="flex items-center gap-2"><span className="text-primary">★</span> Upcoming launch access</li>
                <li className="flex items-center gap-2"><span className="text-primary">★</span> Live countdown timer</li>
                <li className="flex items-center gap-2"><span className="text-primary">★</span> Member participation count</li>
                <li className="flex items-center gap-2"><span className="text-primary">★</span> Launch notifications</li>
                <li className="flex items-center gap-2"><span className="text-primary">★</span> Project information before launch</li>
                <li className="flex items-center gap-2"><span className="text-primary">★</span> Everything in Free</li>
              </ul>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-16">
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
