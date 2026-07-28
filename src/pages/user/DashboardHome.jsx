import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { fetchCurrentAccess, hasSupabaseConfig, supabase } from '../../lib/supabase';
import { fetchLaunches } from '../../lib/launchAccess';

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({ hrs: '00', min: '00', sec: '00', total: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ hrs: '00', min: '00', sec: '00', total: 0 });
        return;
      }

      const hrs = Math.floor(distance / (1000 * 60 * 60));
      const min = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const sec = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        hrs: hrs.toString().padStart(2, '0'),
        min: min.toString().padStart(2, '0'),
        sec: sec.toString().padStart(2, '0'),
        total: distance
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export default function DashboardHome() {
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextLaunch, setNextLaunch] = useState(null);
  const [prevLaunch, setPrevLaunch] = useState(null);
  const [news, setNews] = useState([]);
  
  const isPremium = profile?.access_tier === 'premium' || profile?.is_premium;

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      if (hasSupabaseConfig && supabase) {
        try {
          const [{ profile: currentProfile, isPremium: premiumAccess }, { data: upcomingLaunches }, { data: completedLaunches }] = await Promise.all([
            fetchCurrentAccess(),
            fetchLaunches({ status: 'upcoming', limit: 1 }),
            fetchLaunches({ status: 'completed', limit: 1 })
          ]);

          setProfile({
            ...currentProfile,
            access_tier: premiumAccess ? 'premium' : currentProfile?.access_tier || 'free',
            is_premium: premiumAccess,
          });
          setUserData({ name: currentProfile?.full_name || 'User' });
          
          setNextLaunch(upcomingLaunches?.[0] || null);
          setPrevLaunch(completedLaunches?.[0] || {
            id: 'sample-prev',
            name: 'Neon Nexus',
            roi: '+450%',
            status: 'completed'
          });

          const { data: newsData } = await supabase
            .from('news_posts')
            .select('*')
            .not('published_at', 'is', null)
            .order('published_at', { ascending: false })
            .limit(3);
            
          setNews(newsData?.length > 0 ? newsData : [
            { id: '1', title: 'New Staking Tiers Live', category: 'platform', published_at: new Date().toISOString(), slug: 'tradepad-10000-launches' },
            { id: '2', title: 'Security Audit Passed', category: 'premium', published_at: new Date(Date.now() - 86400000).toISOString(), slug: 'conviction-scoring-v2' },
            { id: '3', title: 'Community AMA tomorrow', category: 'launch', published_at: new Date(Date.now() - 86400000 * 2).toISOString(), slug: 'scheduled-maintenance' }
          ]);
        } catch (e) {
          console.error(e);
        }
      } else {
        setUserData({ name: 'Jacob' });
        setProfile({ access_tier: 'premium', is_premium: true });
        
        const in1Day = new Date(Date.now() + 86400000 + 120000).toISOString();
        setNextLaunch({
          id: 'sample-next-launch',
          title: 'Next Launch',
          launch_at: in1Day,
          joined_count: 284,
        });
        
        setPrevLaunch({
          id: 'prev-1',
          name: 'Neon Nexus',
          roi: '+450%',
          status: 'completed'
        });

        setNews([
          { id: '1', title: 'New Staking Tiers Live', slug: 'tradepad-10000-launches' },
          { id: '2', title: 'Security Audit Passed', slug: 'conviction-scoring-v2' },
          { id: '3', title: 'Community AMA tomorrow', slug: 'scheduled-maintenance' }
        ]);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const countdown = useCountdown(nextLaunch?.launch_at);

  if (loading) {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-neon-red/20 border-t-neon-red rounded-full animate-spin"></div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-8 relative">
      
      {/* Ambient background glows */}
      <div className="absolute top-40 left-10 w-96 h-96 bg-neon-red/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="pt-4 pb-2 px-2 flex items-center justify-between">
        <h1 className="font-headline-lg text-4xl text-on-surface tracking-tight">
          Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-red to-primary">{userData?.name?.split(' ')[0] || 'User'}</span>
        </h1>
        <div className="hidden md:flex items-center gap-2 text-on-surface-variant bg-white/5 px-4 py-2 rounded-full border border-white/5">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-xs font-label-mono tracking-wider uppercase">System Online</span>
        </div>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Large Glass Card (3/3 spanning) */}
        <div className="glass-card rounded-[2rem] p-10 flex flex-col gap-6 relative overflow-hidden group lg:col-span-3 border-white/10 hover:border-neon-red/30 transition-colors duration-500 shadow-2xl">
          <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none"></div>
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-colors duration-700 pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-neon-red/10 blur-[100px] rounded-full group-hover:bg-neon-red/20 transition-colors duration-700 pointer-events-none"></div>
          
          <div className="flex flex-col gap-6 relative z-10">
            
            {isPremium && nextLaunch ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-10 w-full mt-4">
                
                {/* Left Side: Circle and Quote */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-20 h-20 shrink-0 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary/10 relative">
                    <span className="material-symbols-outlined text-primary text-4xl">help</span>
                    <div className="absolute -inset-2 rounded-full border border-primary/10 animate-spin-slow pointer-events-none"></div>
                  </div>
                  
                  <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-xs">
                     <span className="bg-neon-red/10 border border-neon-red/30 text-neon-red px-3 py-1 rounded-full text-[10px] font-label-mono uppercase tracking-wider mb-2">
                       Speed is the edge
                     </span>
                     <p className="text-on-surface-variant text-sm leading-relaxed italic">
                       "It's not about who is the best, but who is first."
                     </p>
                  </div>
                </div>
                
                {/* Right Side: Countdown Timer */}
                <div className="flex flex-col items-center gap-4 md:ml-auto">
                  <p className="text-on-surface-variant/70 font-label-mono uppercase tracking-widest text-[11px]">Next Launch in</p>
                  <div className="flex gap-4 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="countdown-box w-24 h-28 md:w-28 md:h-32 rounded-xl flex items-center justify-center border-t border-white/20 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] shadow-[0_10px_30px_rgba(255,46,46,0.15)] group-hover:shadow-[0_10px_40px_rgba(255,46,46,0.25)] transition-shadow duration-500">
                      <span className="font-display-lg text-neon-red text-5xl md:text-6xl tracking-tighter" id="hrs">{countdown.hrs}</span>
                    </div>
                    <span className="font-label-mono text-[12px] text-on-surface-variant opacity-50 tracking-widest">HRS</span>
                  </div>
                  <div className="font-display-lg text-neon-red text-4xl mt-[-20px] opacity-30 animate-pulse">:</div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="countdown-box w-24 h-28 md:w-28 md:h-32 rounded-xl flex items-center justify-center border-t border-white/20 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] shadow-[0_10px_30px_rgba(255,46,46,0.15)] group-hover:shadow-[0_10px_40px_rgba(255,46,46,0.25)] transition-shadow duration-500">
                      <span className="font-display-lg text-neon-red text-5xl md:text-6xl tracking-tighter" id="min">{countdown.min}</span>
                    </div>
                    <span className="font-label-mono text-[12px] text-on-surface-variant opacity-50 tracking-widest">MIN</span>
                  </div>
                  <div className="font-display-lg text-neon-red text-4xl mt-[-20px] opacity-30 animate-pulse">:</div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="countdown-box w-24 h-28 md:w-28 md:h-32 rounded-xl flex items-center justify-center border-t border-white/20 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] shadow-[0_10px_30px_rgba(255,46,46,0.15)] group-hover:shadow-[0_10px_40px_rgba(255,46,46,0.25)] transition-shadow duration-500">
                      <span className="font-display-lg text-neon-red text-5xl md:text-6xl tracking-tighter" id="sec">{countdown.sec}</span>
                    </div>
                    <span className="font-label-mono text-[12px] text-on-surface-variant opacity-50 tracking-widest">SEC</span>
                  </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 md:ml-auto opacity-70">
                <span className="material-symbols-outlined text-4xl text-white/20">hourglass_empty</span>
                <p className="text-on-surface-variant max-w-sm text-sm">
                  Free members stay in the archive only. Next launch details and countdown are hidden until you upgrade.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-4 mt-6 relative z-10 w-full md:w-auto md:ml-auto">
            <Link to={isPremium ? "/dashboard/user/upcoming" : "/dashboard/user/premium"} className="flex-1 md:flex-none text-center bg-neon-red text-white font-bold px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(255,46,46,0.3)] hover:shadow-[0_0_30px_rgba(255,46,46,0.6)] hover:bg-red-500 transition-all active:scale-95">
              {isPremium ? 'Participate Now' : 'Upgrade to Premium'}
            </Link>
            <Link to="/dashboard/user/previous" className="flex-1 md:flex-none text-center bg-white/5 border border-white/10 text-on-surface font-bold px-8 py-4 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all active:scale-95 backdrop-blur-md">
              View Archive
            </Link>
          </div>
        </div>
      </div>
      
      {/* Middle Row (Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card rounded-2xl p-8 flex items-center gap-6 group hover:-translate-y-1 hover:border-primary/50 transition-all duration-300 cursor-default shadow-lg hover:shadow-primary/10">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
          <div>
            <p className="text-xs font-label-mono text-on-surface-variant uppercase">Access</p>
            <h3 className="font-headline-md text-2xl capitalize">{profile?.access_tier || 'Free'}</h3>
          </div>
        </div>
        
        <div className="glass-card rounded-2xl p-8 flex items-center gap-6 group hover:-translate-y-1 hover:border-primary/50 transition-all duration-300 cursor-default shadow-lg hover:shadow-primary/10">
          <div className="w-14 h-14 rounded-xl bg-surface-variant/80 border border-white/5 flex items-center justify-center text-on-surface group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div>
            <p className="text-xs font-label-mono text-on-surface-variant uppercase tracking-wider">Archive</p>
            <h3 className="font-headline-md text-2xl mt-1">Available</h3>
          </div>
        </div>
        
        <div className="glass-card rounded-2xl p-8 flex items-center gap-6 group hover:-translate-y-1 hover:border-neon-red/50 transition-all duration-300 cursor-default shadow-lg hover:shadow-neon-red/10">
          <div className="w-14 h-14 rounded-xl bg-neon-red/10 border border-neon-red/20 flex items-center justify-center text-neon-red group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div>
            <p className="text-xs font-label-mono text-on-surface-variant uppercase tracking-wider">Next Launch</p>
            <h3 className="font-headline-md text-2xl text-neon-red mt-1">
              {isPremium && nextLaunch ? `${countdown.hrs}h ${countdown.min}m` : 'Hidden'}
            </h3>
          </div>
        </div>
      </div>
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card rounded-[2rem] p-8 flex flex-col gap-6 border border-white/5 hover:border-white/10 transition-colors shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neon-red/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-neon-red">history</span>
              </div>
              <h3 className="font-headline-md text-2xl text-on-surface">Previous Launch</h3>
            </div>
            <Link to="/dashboard/user/previous" className="group flex items-center gap-1 text-xs font-label-mono text-on-surface-variant hover:text-neon-red transition-colors bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:border-neon-red/30">
              <span>View All</span>
              <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">chevron_right</span>
            </Link>
          </div>
          
          {prevLaunch ? (
            <div className="flex flex-col gap-4 bg-[#0a0a0a]/50 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-red"></div>
              
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant/60 text-xs uppercase font-label-mono flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">rocket</span> Project</span>
                <span className="font-bold text-lg text-on-surface">{prevLaunch.name}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                <span className="text-on-surface-variant/60 text-xs uppercase font-label-mono flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">show_chart</span> ROI / Current MC</span>
                <span className="font-label-mono text-neon-red bg-neon-red/10 px-2 py-0.5 rounded border border-neon-red/20">{prevLaunch.roi || prevLaunch.current_mc || 'TBA'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                <span className="text-on-surface-variant/60 text-xs uppercase font-label-mono flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">flag</span> Status</span>
                <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md text-[10px] font-label-mono uppercase tracking-widest font-bold">{prevLaunch.status || 'Completed'}</span>
              </div>
              <Link to={`/dashboard/user/launch/${prevLaunch.id}`} className="mt-4 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-on-surface py-3 rounded-xl font-label-mono text-xs transition-colors border border-white/10 hover:border-white/30">
                View Deep Dive <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </Link>
            </div>
          ) : (
             <div className="text-center py-6">
               <p className="text-on-surface-variant text-sm">No previous launches available.</p>
             </div>
          )}
        </div>
        
        <div className="glass-card rounded-[2rem] p-8 flex flex-col gap-6 border border-white/5 hover:border-white/10 transition-colors shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[100px]">newspaper</span>
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-white/5 relative z-10">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                 <span className="material-symbols-outlined text-primary">newspaper</span>
               </div>
               <h3 className="font-headline-md text-2xl text-on-surface">Latest Intel</h3>
             </div>
             <Link to="/dashboard/user/news" className="group flex items-center gap-1 text-xs font-label-mono text-on-surface-variant hover:text-primary transition-colors bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:border-primary/30">
                <span>Read All</span>
                <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">chevron_right</span>
             </Link>
          </div>
          
          <div className="relative z-10">
            {news.length > 0 ? (
              <ul className="flex flex-col gap-3">
              {news.map((n) => (
                <li key={n.id}>
                  <Link to={`/dashboard/user/news/${n.slug}`} className="flex flex-col gap-2 group block p-4 bg-[#0a0a0a]/50 rounded-xl border border-white/5 hover:border-primary/30 hover:bg-[#0a0a0a]/80 transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 group-hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-shadow"></div>
                        <span className="text-[10px] font-label-mono text-primary uppercase tracking-wider">{n.category || 'update'}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/40 font-label-mono">
                        {n.published_at ? new Date(n.published_at).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 mt-1">
                      <p className="text-on-surface text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">{n.title}</p>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant/30 group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <p className="text-on-surface-variant text-sm">No recent updates.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
