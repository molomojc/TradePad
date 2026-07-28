import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { supabase, hasSupabaseConfig } from '../lib/supabase'; // Adjust import path as needed

export default function Home({ setActiveTab }) {
  const navigate = useNavigate();
  const openAuthModal = useAuthStore(state => state.openAuthModal);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalLaunches, setTotalLaunches] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  // Fetch platform metrics and total launches
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!supabase) throw new Error('Supabase client not initialized');
        
        // Get latest platform metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('platform_metrics')
          .select('*')
          .order('metric_date', { ascending: false })
          .limit(1)
          .single();

        if (metricsError) throw metricsError;
        setStats(metricsData);

        // Get total launches count
        const { count, error: countError } = await supabase
          .from('launches')
          .select('*', { count: 'exact', head: true });

        if (countError) throw countError;
        setTotalLaunches(count || 0);
      } catch (error) {
        console.error('Error fetching platform data:', error);
        // Set fallback stats
        setStats({
          free_users: 0,
          premium_users: 0,
          active_launches: 0,
          archived_launches: 0,
          monthly_mrr: 0,
          total_volume: 0,
          metric_date: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewLaunch = async (e) => {
    e.preventDefault();
    if (!hasSupabaseConfig) {
      navigate('/dashboard/user/upcoming');
      return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/dashboard/user/upcoming');
    } else {
      openAuthModal('login');
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  };

  // Static feature blocks
  const FEATURE_BLOCKS = [
    {
      title: 'Verified Launches',
      description: 'Every token is launched by the TradePad team. No public submissions, no anonymous developers, and no unverified projects.',
      accent: 'from-cyan-400/20 to-cyan-400/0',
      icon: 'verified_user'
    },
    {
      title: 'Premium Early Access',
      description: 'Premium members unlock the next launch before everyone else, including launch dates, countdown timers, project information, and member statistics.',
      accent: 'from-purple-400/20 to-purple-400/0',
      icon: 'workspace_premium'
    },
    {
      title: 'Fair Launch Model',
      description: 'Every launch follows the same transparent process. No hidden allocations, no insider groups, and no surprise listings.',
      accent: 'from-emerald-400/20 to-emerald-400/0',
      icon: 'balance'
    },
  ];

  // Free tier features
  const freeTierItems = [
    'View completed launches',
    'Browse project history',
    'Follow platform announcements',
    'Upgrade anytime',
  ];

  // Premium features
  const premiumItems = [
    'Upcoming launch details',
    'Live launch countdown',
    'Member participation tracker',
    'Project roadmap',
    'Token information',
    'Instant launch notifications',
  ];

  const whyChooseCards = [
    {
      title: 'Transparent',
      desc: 'Every launch is managed by our own team. No anonymous developers.',
      icon: 'visibility'
    },
    {
      title: 'Predictable',
      desc: 'Launches happen on a consistent schedule so members always know when to prepare.',
      icon: 'calendar_month'
    },
    {
      title: 'Fair',
      desc: 'Everyone gets the same launch information at the same time based on their membership level.',
      icon: 'balance'
    },
    {
      title: 'Trusted',
      desc: 'Every project published on TradePad goes through an internal review before launch.',
      icon: 'shield'
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 relative px-6 md:px-margin-desktop py-12 overflow-hidden">

      {/* HERO SECTION */}
      <section
        className="relative py-20 md:py-28 px-6 md:px-12 rounded-[2rem] text-left border border-white/10 overflow-hidden bg-cover bg-center mb-16 shadow-2xl animate-in slide-in-from-bottom-6 duration-700"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(5, 5, 8, 0.97), rgba(5, 5, 8, 0.72)), url("/hero_background.png")`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,240,255,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(181,51,255,0.10),transparent_30%)]"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-10 items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 font-mono text-primary bg-primary/10 px-3.5 py-1.5 rounded-full text-caption border border-primary/20 tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-500">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              THE NEXT LAUNCH STARTS HERE
            </span>

            <h1 className="font-display text-4xl md:text-6xl font-bold mt-8 mb-6 text-white leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-700">
              Premium, vetted
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-purple-400">
                Solana token launches.
              </span>
            </h1>

            <div className="font-sans text-on-surface-variant max-w-xl mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 space-y-4">
              <p>
                TradePad is a launch platform built for fair, transparent Solana token launches.
              </p>
              <p>
                Every project is created and verified by our team. Premium members receive early access to upcoming launches, countdown timers, project information, and launch notifications before they become public.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
              <button
                onClick={handleViewLaunch}
                className="bg-primary text-black hover:bg-primary-fixed active:scale-95 transition-all px-8 py-3.5 rounded-full font-mono font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.3)] inline-block"
              >
                View Upcoming Launch
              </button>
              <Link
                to="/pricing"
                className="bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all px-8 py-3.5 rounded-full font-mono font-bold text-sm text-white backdrop-blur-md inline-block"
              >
                Become Premium
              </Link>
            </div>

            <p className="font-mono text-on-surface-variant/70 text-[11px] mt-6 tracking-wider uppercase">
              New launches every two weeks • No anonymous developers • No community listings
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-right-6 duration-700 delay-150" />
        </div>
      </section>

      {/* Centered video preview card */}
      <section className="py-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
        <div className="glass-card rounded-[2rem] border-white/10 overflow-hidden relative shadow-2xl">
          <video
            ref={videoRef}
            src="/video.mp4"
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="w-full aspect-video object-cover bg-surface-dark"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none"></div>

          <span className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 font-mono text-[10px] text-white tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            HOW TRADEPAD WORKS
          </span>

          <button
            onClick={toggleMute}
            className="absolute bottom-5 right-5 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 active:scale-95 transition-all"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </button>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 mb-10">
        {FEATURE_BLOCKS.map((block, index) => (
          <div
            key={block.title}
            className="glass-card rounded-3xl p-8 border-white/10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 group"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${block.accent} pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <span className="material-symbols-outlined text-primary text-2xl">{block.icon}</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-3">{block.title}</h3>
              <p className="text-on-surface-variant text-[14px] leading-relaxed">{block.description}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Why Choose TradePad Grid */}
      <section className="py-12 mb-10">
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-display">
            Why members choose TradePad
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChooseCards.map((card, idx) => (
            <div key={idx} className="glass-card p-8 rounded-3xl border-white/10 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
              <span className="material-symbols-outlined text-3xl text-primary mb-4 bg-primary/10 p-3 rounded-2xl border border-primary/20">
                {card.icon}
              </span>
              <h3 className="text-white font-bold text-lg mb-2">{card.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works - Free vs Premium */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4 mb-10">
        <div className="glass-card rounded-[2rem] p-8 md:p-12 border-white/10 overflow-hidden relative animate-in fade-in slide-in-from-left-6 duration-700">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-3xl"></div>
          
          <h3 className="text-3xl font-display font-bold text-white mb-4">
            Explore the Platform
          </h3>
          <p className="text-on-surface-variant leading-relaxed mb-8 max-w-md">
            Browse previous launches, learn about completed projects, and see how every launch performed after going live.
          </p>
          <div className="space-y-4">
            {freeTierItems.map((item) => (
              <div key={item} className="flex items-center gap-4 text-white text-sm font-medium">
                <span className="material-symbols-outlined text-white/40 text-[20px]">check_circle</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-8 md:p-12 border-primary/20 overflow-hidden relative animate-in fade-in slide-in-from-right-6 duration-700 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/15 blur-3xl"></div>
          <span className="absolute top-8 right-8 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono text-[10px] tracking-wide whitespace-nowrap shadow-[0_0_15px_rgba(0,240,255,0.1)]">
            PREMIUM ACCESS
          </span>
          
          <h3 className="text-3xl font-display font-bold text-white mb-4 max-w-[85%] mt-8 lg:mt-0">
            Know what's launching next
          </h3>
          <p className="text-on-surface-variant leading-relaxed mb-8 max-w-md">
            Premium members receive exclusive access to upcoming launches before they are announced publicly, giving them time to research each project before launch day.
          </p>
          <div className="space-y-4">
            {premiumItems.map((item) => (
              <div key={item} className="flex items-center gap-4 text-white text-sm font-medium">
                <span className="material-symbols-outlined text-primary text-[20px] drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">star</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badge Section */}
      <section className="py-6 mt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
        <div className="glass-card rounded-3xl p-8 border-white/10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[28px]">verified</span>
                <span className="text-white font-bold text-lg">Verified Projects</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[28px]">visibility</span>
                <span className="text-white font-bold text-lg">Transparent Launch Process</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[28px]">handshake</span>
                <span className="text-white font-bold text-lg">Built for Long-Term Members</span>
              </div>
            </div>
            <p className="text-on-surface-variant text-sm max-w-2xl mx-auto leading-relaxed">
              TradePad is building a safer and more transparent way to discover new Solana launches. Every project is reviewed, scheduled, and launched through one trusted platform.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}