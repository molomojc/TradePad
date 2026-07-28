import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase'; // Adjust import path as needed

export default function Home({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalLaunches, setTotalLaunches] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const videoRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Fetch platform metrics and total launches
  useEffect(() => {
    const fetchData = async () => {
      try {
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

  // Auto-slide testimonials
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(autoPlayRef.current);
  }, []);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  };

  const goToTestimonial = (index) => {
    setCurrentTestimonial(index);
    // Reset auto-play timer
    clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Testimonials data
  const testimonials = [
    {
      name: 'Alex Rivera',
      role: 'Crypto Trader, 4 years experience',
      content: 'TradePad completely changed how I approach new listings. Getting that 15-minute head start on premium has saved me from countless rug pulls and helped me catch genuine opportunities early.',
      avatar: 'AR',
      platform: 'Premium Member',
    },
    {
      name: 'Sarah Chen',
      role: 'DeFi Researcher',
      content: 'The historical depth is unmatched. Being able to see how previous launches performed with full market context has made my research 10x more effective. This is the tool I wish I had years ago.',
      avatar: 'SC',
      platform: 'Free Member',
    },
    {
      name: 'Marcus Thompson',
      role: 'Crypto Hedge Fund Analyst',
      content: "I've tried every launch tracker out there. TradePad's commitment to chronological ordering over opinion-based ranking is a game-changer. It's the only source I trust for unbiased launch data.",
      avatar: 'MT',
      platform: 'Premium Member',
    },
    {
      name: 'Jessica Park',
      role: 'Blockchain Developer',
      content: 'The AI conviction scoring has been incredibly accurate for our team. We use it as a sanity check before deploying any capital into new projects. Saved us from at least 3 obvious scams last month alone.',
      avatar: 'JP',
      platform: 'Enterprise User',
    },
    {
      name: 'David Kim',
      role: 'Day Trader',
      content: 'The speed of detection is insane. By the time other platforms show a launch, I\'ve already had 10 minutes to analyze and make a decision. TradePad is my secret weapon.',
      avatar: 'DK',
      platform: 'Premium Member',
    },
  ];

  // Static feature blocks
  const FEATURE_BLOCKS = [
    {
      title: 'Free access',
      description: 'See every public launch and the full historical archive — no subscription, no gimmicks.',
      accent: 'from-cyan-400/20 to-cyan-400/0',
    },
    {
      title: 'Premium research',
      description: 'Get launches the moment they hit the feed, plus conviction scoring before the crowd arrives.',
      accent: 'from-purple-400/20 to-purple-400/0',
    },
    {
      title: 'Historical depth',
      description: 'Go back through every prior drop with performance snapshots and market context intact.',
      accent: 'from-emerald-400/20 to-emerald-400/0',
    },
  ];

  // Free tier features
  const freeTierItems = [
    'Browse public listings',
    'Search archived launches',
    'Read platform notices',
  ];

  // Premium features
  const premiumItems = [
    'Latest launch research',
    'AI conviction scoring',
    'Priority update stream',
  ];

  return (
    <div className="animate-in fade-in duration-500 relative px-6 md:px-margin-desktop py-12 overflow-hidden">

      <section
        className="relative py-20 md:py-28 px-6 md:px-12 rounded-[2rem] text-left border border-white/10 overflow-hidden bg-cover bg-center mb-16 shadow-2xl animate-in slide-in-from-bottom-6 duration-700"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(15, 15, 18, 0.97), rgba(15, 15, 18, 0.72)), url("/hero_background.png")`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,255,0,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_30%)]"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-10 items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 font-label-mono text-primary bg-primary/10 px-3.5 py-1.5 rounded-full text-caption border border-primary/20 tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-500">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              SPEED IS THE EDGE
            </span>

            <h1 className="font-display-lg text-4xl md:text-6xl font-bold mt-8 mb-6 text-white leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-700">
              It's not about who's the best,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-green-400">
                it's who is first.
              </span>
            </h1>

            <p className="font-body-lg text-on-surface-variant max-w-xl mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              TradePad tracks every new listing the second it appears and orders the feed by arrival time, not
              opinion. Free members see the public queue. Premium members see it first.
            </p>

            <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
              <button
                onClick={() => setActiveTab?.('launch')}
                className="bg-white text-black hover:bg-neutral-200 active:scale-95 transition-all px-8 py-3.5 rounded-full font-label-mono font-bold text-sm shadow-[0_10px_30px_rgba(255,255,255,0.10)]"
              >
                Browse Launches
              </button>
              <button
                onClick={() => setActiveTab?.('premium')}
                className="bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all px-8 py-3.5 rounded-full font-label-mono font-bold text-sm text-white"
              >
                View Premium
              </button>
            </div>

            <p className="font-label-mono text-on-surface-variant/50 text-[11px] mt-6 tracking-wider uppercase">
              New listings detected roughly every 90 seconds
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-right-6 duration-700 delay-150" />
        </div>
      </section>

      {/* Centered video preview card */}
      <section className="max-w-4xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
        <div className="relative rounded-[2rem] overflow-hidden border border-white/10 glass-card shadow-2xl">
          <video
            ref={videoRef}
            src="/video.mp4"
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="w-full aspect-video object-cover"
          />

          {/* subtle gradient so overlay controls stay legible on bright frames */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none"></div>

          <span className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 font-label-mono text-[10px] text-white tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            PLATFORM PREVIEW
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

      {/* Testimonials Carousel Section - White Theme */}
      <section className="py-6 mb-6">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            What our users say
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
          <span className="text-[11px] font-label-mono text-on-surface-variant/50 tracking-wider uppercase whitespace-nowrap">
            {totalLaunches}+ launches tracked
          </span>
        </div>

        {/* Carousel Container */}
        <div className="relative glass-card rounded-3xl p-8 md:p-12 border-white/10 overflow-hidden bg-white/5 backdrop-blur-xl">
          {/* White gradient accents */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
          
          {/* Navigation Arrows */}
          <button
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-110"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          
          <button
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-110"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>

          {/* Testimonials Slider */}
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="min-w-full px-8 py-4"
                >
                  <div className="max-w-3xl mx-auto text-center">
                    {/* Quote Icon */}
                    <div className="flex justify-center mb-4">
                      <span className="material-symbols-outlined text-white/20 text-[48px]">
                        format_quote
                      </span>
                    </div>
                    
                    {/* Content */}
                    <p className="text-white text-lg md:text-xl leading-relaxed mb-6 font-light">
                      "{testimonial.content}"
                    </p>
                    
                    {/* Avatar & Info */}
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center font-bold text-white text-base border border-white/20">
                        {testimonial.avatar}
                      </div>
                      <div className="text-left">
                        <h4 className="text-white font-bold text-base">{testimonial.name}</h4>
                        <p className="text-white/60 text-sm">{testimonial.role}</p>
                        <span className="inline-block mt-1 text-[10px] font-label-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                          {testimonial.platform}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex justify-center gap-1 mt-4">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-primary text-[18px]">
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`transition-all duration-300 rounded-full ${
                  currentTestimonial === index
                    ? 'w-8 h-2 bg-white'
                    : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
        {FEATURE_BLOCKS.map((block, index) => (
          <div
            key={block.title}
            className="glass-card rounded-3xl p-6 border-white/10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${block.accent} pointer-events-none`}></div>
            <div className="relative z-10">
              <h3 className="text-white font-bold text-lg mb-3">{block.title}</h3>
              <p className="text-on-surface-variant text-[14px] leading-relaxed">{block.description}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
        <div className="glass-card rounded-[2rem] p-8 border-white/10 overflow-hidden relative animate-in fade-in slide-in-from-left-6 duration-700">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl"></div>
          <span className="text-[11px] font-label-mono text-primary tracking-wider uppercase block mb-3">
            What free users get
          </span>
          <h3 className="text-2xl font-bold text-white mb-4">
            Public launches, archives, and platform updates
          </h3>
          <p className="text-on-surface-variant leading-relaxed mb-6">
            The free tier is built for discovery. Browse older coins, view public launch data, and follow the
            platform as new entries are added — no subscription required.
          </p>
          <div className="space-y-3">
            {freeTierItems.map((item) => (
              <div key={item} className="flex items-center gap-3 text-white text-sm">
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-8 border-purple-500/20 overflow-hidden relative animate-in fade-in slide-in-from-right-6 duration-700">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-500/15 blur-3xl"></div>
          <span className="absolute top-8 right-8 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-label-mono text-[10px] tracking-wide whitespace-nowrap">
            ~15 MIN HEAD START
          </span>
          <span className="text-[11px] font-label-mono text-purple-400 tracking-wider uppercase block mb-3">
            What premium gets
          </span>
          <h3 className="text-2xl font-bold text-white mb-4 max-w-[85%]">
            Latest data, conviction scores, and early signals
          </h3>
          <p className="text-on-surface-variant leading-relaxed mb-6">
            Premium members see launches as they're detected, with deeper analytics and a head start on the
            information that matters before the crowd shows up.
          </p>
          <div className="space-y-3">
            {premiumItems.map((item) => (
              <div key={item} className="flex items-center gap-3 text-white text-sm">
                <span className="material-symbols-outlined text-purple-400 text-[18px]">star</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badge Section */}
      <section className="py-6 mt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
        <div className="glass-card rounded-3xl p-8 border-white/10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5"></div>
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[28px]">verified</span>
                <span className="text-white font-bold">100% Transparency</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-cyan-400 text-[28px]">bolt</span>
                <span className="text-white font-bold">Real-time Detection</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-400 text-[28px]">shield</span>
                <span className="text-white font-bold">Community Trusted</span>
              </div>
            </div>
            <p className="text-on-surface-variant text-sm">
              Join thousands of traders who rely on TradePad for unbiased, chronological launch data
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}