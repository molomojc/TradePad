import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { fetchCurrentAccess, hasSupabaseConfig, supabase } from '../../lib/supabase';
import { fetchLaunches, parseDateSafe } from '../../lib/launchAccess';
import Skeleton from '../../components/Skeleton';
import { motion } from 'framer-motion';

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({ days: '00', hrs: '00', min: '00', sec: '00' });

  useEffect(() => {
    const update = () => {
      const parsed = parseDateSafe(targetDate);
      const distance = parsed ? Math.max(parsed.getTime() - Date.now(), 0) : 0;
      setTimeLeft({
        days: String(Math.floor(distance / 86400000)).padStart(2, '0'),
        hrs: String(Math.floor((distance % 86400000) / 3600000)).padStart(2, '0'),
        min: String(Math.floor((distance % 3600000) / 60000)).padStart(2, '0'),
        sec: String(Math.floor((distance % 60000) / 1000)).padStart(2, '0'),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export default function DashboardHome() {
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveLaunch, setLiveLaunch] = useState(null);
  const [nextLaunch, setNextLaunch] = useState(null);
  const [previousLaunch, setPreviousLaunch] = useState(null);
  const [news, setNews] = useState([]);
  const isPremium = profile?.access_tier === 'premium' || profile?.is_premium;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (hasSupabaseConfig && supabase) {
          const [{ profile: currentProfile, isPremium: premiumAccess }, { data: live }, { data: upcoming }, { data: completed }] = await Promise.all([
            fetchCurrentAccess(),
            fetchLaunches({ status: 'live', limit: 1 }),
            fetchLaunches({ status: 'upcoming', limit: 1 }),
            supabase.from('launches').select('*').in('status', ['closed', 'archived']).order('launch_at', { ascending: false }).limit(1),
          ]);
          
          setProfile({ 
            ...currentProfile, 
            access_tier: premiumAccess ? 'premium' : currentProfile?.access_tier || 'free', 
            is_premium: premiumAccess 
          });
          setUserData({ name: currentProfile?.full_name || 'User' });
          setLiveLaunch(live?.[0] || null);
          setNextLaunch(upcoming?.[0] || null);
          setPreviousLaunch(completed?.[0] || null);
          
          const { data } = await supabase
            .from('news_posts')
            .select('*')
            .not('published_at', 'is', null)
            .order('published_at', { ascending: false })
            .limit(3);
            
          setNews(data?.length ? data : []);
        } else {
          setUserData(null);
          setProfile(null);
          setLiveLaunch(null);
          setNextLaunch(null);
          setPreviousLaunch(null);
          setNews([]);
        }
      } catch (error) {
        console.error(error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const countdown = useCountdown(nextLaunch?.launch_at);
  const launchDate = nextLaunch?.launch_at ? parseDateSafe(nextLaunch.launch_at) : null;
  const isLaunchDay = launchDate ? new Date().toDateString() === launchDate.toDateString() : false;
  const launchName = nextLaunch?.title || nextLaunch?.name || 'Next launch';
  const firstName = userData?.name?.split(' ')[0] || 'there';

  const liveLaunchTime = liveLaunch?.launch_at ? parseDateSafe(liveLaunch.launch_at).getTime() : 0;
  const [liveSecondsRemaining, setLiveSecondsRemaining] = useState(0);

  useEffect(() => {
    if (!liveLaunch || liveLaunchTime === 0) return;

    const updateTimer = () => {
      const timePast = Date.now() - liveLaunchTime;
      const bufferDuration = 15 * 60 * 1000;
      const remaining = Math.max(0, Math.ceil((bufferDuration - timePast) / 1000));
      setLiveSecondsRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [liveLaunch, liveLaunchTime]);

  const isLiveBufferActive = liveLaunch && liveSecondsRemaining > 0;

  if (loading) {
    return (
      <PageTransition className="mx-auto w-full max-w-[1440px] space-y-6 pb-10">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-8 w-40 rounded-full" />
        </section>
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.75fr)]">
          <div className="space-y-6">
            <Skeleton className="h-[280px] w-full rounded-3xl" />
            <Skeleton className="h-[280px] w-full rounded-3xl" />
          </div>
          <Skeleton className="h-[584px] w-full rounded-3xl" />
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto w-full max-w-[1440px] space-y-6 pb-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-mono text-on-surface-variant uppercase tracking-wider">
            <span>Workspace</span><span>/</span><span className="text-on-surface">Overview</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-on-surface sm:text-4xl mt-2 mb-2">Good evening, {firstName}</h1>
          <p className="text-on-surface-variant max-w-md">Discover the next generation of premium, vetted community memecoin launches.</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-outline-variant bg-surface px-4 py-2 text-xs font-mono text-on-surface sm:self-auto shadow-lg">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.6)] animate-pulse" />
          All systems operational
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.75fr)]">
        <div className="space-y-6">
          {/* Live Launch Card (pulsing active pool dashboard) */}
          {liveLaunch && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl overflow-hidden relative"
            >
              <div className="flex flex-col gap-4 border-b border-outline-variant px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative z-10">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live Now
                    </span>
                    {isPremium && <span className="inline-flex items-center px-2 py-1 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold tracking-wider uppercase">Premium access</span>}
                  </div>
                  <h2 className="text-2xl font-bold text-on-surface font-display">
                    {isLiveBufferActive && !isPremium ? '•••••••••••••' : liveLaunch.name}
                  </h2>
                </div>
                {isLiveBufferActive && !isPremium ? (
                  <Link to="/dashboard/user/premium" className="secondary-button shrink-0 relative z-10 text-xs bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20">
                    Unlock Now <span className="material-symbols-outlined text-[16px]">lock</span>
                  </Link>
                ) : (
                  <Link to={`/dashboard/user/launch/${btoa(liveLaunch.id)}`} className="secondary-button shrink-0 relative z-10 text-xs">Participate Live <span className="material-symbols-outlined text-[16px]">arrow_outward</span></Link>
                )}
              </div>

              {isLiveBufferActive && !isPremium ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-emerald-500/5 to-transparent relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                  
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
                      Premium Exclusive
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-on-surface mb-2 relative z-10 font-display">Live Early Access Window</h3>
                  <p className="max-w-md text-xs text-on-surface-variant leading-relaxed mb-4 relative z-10">Public release unlocks in:</p>
                  
                  <div className="text-4xl font-mono font-bold text-on-surface tracking-tight relative z-10 mb-6">
                    {Math.floor(liveSecondsRemaining / 60)}:{(liveSecondsRemaining % 60).toString().padStart(2, '0')}
                  </div>

                  {/* Activity preview */}
                  <div className="grid grid-cols-2 gap-4 w-full max-w-xs mx-auto border-t border-outline-variant pt-4 mb-6 relative z-10">
                    <div>
                      <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-0.5">Buyers</p>
                      <p className="text-on-surface text-lg font-bold font-mono">82</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-0.5">Volume</p>
                      <p className="text-on-surface text-lg font-bold font-mono">41 SOL</p>
                    </div>
                  </div>

                  <Link to="/dashboard/user/premium" className="bg-primary text-black px-6 py-2.5 rounded-xl font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition-transform relative z-10">
                    Get Early Access
                  </Link>
                </div>
              ) : (
                <div className="p-6 relative z-10">
                  <div className="launch-panel relative overflow-hidden rounded-2xl border border-emerald-500/20 p-6 bg-emerald-500/5 shadow-inner">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] pointer-events-none"></div>
                    
                    <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                      <div>
                        <p className="dashboard-label text-emerald-400">ACTIVE POOL TARGET</p>
                        <h3 className="text-2xl font-bold text-on-surface mt-2 font-display">{liveLaunch.target_raise || 'TBA'}</h3>
                        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed max-w-md">
                          {liveLaunch.description || 'This vetted Solana project is currently live. Whitelist entries are closed, pool claims and DEX liquidity lockup are underway.'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t border-outline-variant pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                        <div>
                          <p className="dashboard-label mb-2">Symbol</p>
                          <p className="text-xl font-bold text-on-surface font-mono">${liveLaunch.symbol}</p>
                        </div>
                        <div>
                          <p className="dashboard-label mb-2">Participants</p>
                          <p className="text-xl font-bold text-on-surface font-mono">{liveLaunch.joined_count || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px] text-emerald-400 animate-pulse">check_circle</span> 
                      Pool participation is active.
                    </p>
                    <Link to={`/dashboard/user/launch/${btoa(liveLaunch.id)}`} className="primary-button text-xs bg-emerald-400 hover:bg-emerald-500 text-black shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                      Participate Live <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Upcoming Launch Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`glass-card rounded-3xl overflow-hidden relative ${isPremium ? 'ring-1 ring-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : ''}`}
          >
            <div className="flex flex-col gap-4 border-b border-outline-variant px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-mono font-bold tracking-wider uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Upcoming
                  </span>
                  {isPremium && <span className="inline-flex items-center px-2 py-1 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold tracking-wider uppercase">Premium access</span>}
                </div>
                <h2 className="text-2xl font-bold text-on-surface font-display">
                  {isPremium ? (isLaunchDay ? launchName : 'Next launch') : '•••••••••••••'}
                </h2>
              </div>
              <Link to={isPremium ? "/dashboard/user/upcoming" : "/dashboard/user/premium"} className="secondary-button shrink-0 relative z-10 text-xs bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20">
                {isPremium ? 'View details' : 'Unlock Now'} <span className="material-symbols-outlined text-[16px]">{isPremium ? 'arrow_outward' : 'lock'}</span>
              </Link>
            </div>

            {nextLaunch ? (
              <div className="p-6 relative z-10">
                <div className="launch-panel relative overflow-hidden rounded-2xl border border-outline-variant p-6 bg-white/5 shadow-inner">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none"></div>
                  
                  <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                      <p className="dashboard-label">{isLaunchDay ? 'Launching today' : 'Next launch in'}</p>
                      <div className="mt-4 flex items-start gap-2 sm:gap-3">
                        {[
                          ['Days', countdown.days], ['Hours', countdown.hrs], ['Minutes', countdown.min], ['Seconds', countdown.sec],
                        ].map(([label, value]) => (
                          <div key={label} className="min-w-0 flex-1 sm:flex-none">
                            <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-on-surface">{value}</div>
                            <div className="mt-2 text-center text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 border-t border-outline-variant pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                      <div><p className="dashboard-label mb-2">Participants</p><p className="text-2xl font-bold text-on-surface">{nextLaunch.joined_count || 0}</p></div>
                      <div><p className="dashboard-label mb-2">Target raise</p><p className="text-2xl font-bold text-on-surface">{isPremium ? (nextLaunch.target_raise || 'TBA') : '🔒 Locked'}</p></div>
                    </div>
                  </div>
                </div>
                
                {isPremium ? (
                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-[18px] text-primary">lock</span> Your priority allocation window is reserved.</p>
                    <Link to="/dashboard/user/upcoming" className="primary-button text-xs">Review launch <span className="material-symbols-outlined text-[17px]">arrow_forward</span></Link>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-outline-variant pt-5">
                    <div>
                      <p className="text-xs text-on-surface-variant font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-amber-400 text-[16px]">workspace_premium</span> 
                        Premium Unlocks: Full research, Contract, Risk report, Tokenomics
                      </p>
                    </div>
                    <Link to="/dashboard/user/premium" className="bg-primary text-black px-6 py-2 rounded-xl font-mono font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:scale-105 transition-transform text-center whitespace-nowrap">
                      Unlock Details
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-primary/5 to-transparent relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 block font-display">history_toggle_off</span>
                <h3 className="text-xl font-bold text-on-surface mb-2 relative z-10 font-display">No Launches Scheduled</h3>
                <p className="max-w-sm text-on-surface-variant text-sm relative z-10">Check back later for upcoming Solana memecoin drops.</p>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl flex flex-col overflow-hidden border-outline-variant relative"
        >
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none"></div>
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-6 py-6 relative z-10">
            <div>
              <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Launch archive</p>
              <h2 className="text-xl font-bold text-on-surface font-display">Previous launch</h2>
            </div>
            <Link to="/dashboard/user/previous" className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1 text-sm font-semibold">View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span></Link>
          </div>

          <div className="flex-1 p-6 relative z-10">
            {previousLaunch ? (
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start gap-4">
                  {previousLaunch.logo_url ? (
                    <img src={previousLaunch.logo_url} alt={previousLaunch.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover border border-outline-variant shadow-inner" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-outline-variant bg-surface text-lg font-bold text-on-surface shadow-inner">
                      {(previousLaunch.symbol || 'L').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="truncate text-xl font-bold text-on-surface">{previousLaunch.name || previousLaunch.title}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded border border-outline bg-surface-container-high text-on-surface text-[9px] font-mono font-bold tracking-wider uppercase">{previousLaunch.status || 'Completed'}</span>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                      {previousLaunch.launch_at ? new Date(previousLaunch.launch_at).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-outline-variant pt-6 mt-6">
                  <div>
                    <p className="dashboard-label mb-1">Market Cap</p>
                    <p className="text-lg font-bold text-on-surface">{previousLaunch.market_cap || 'Not reported'}</p>
                  </div>
                  <div>
                    <p className="dashboard-label mb-1">Liquidity</p>
                    <p className="text-lg font-bold text-on-surface">{previousLaunch.liquidity || 'Not reported'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="dashboard-label mb-1">Total Holders</p>
                    <p className="text-base font-bold text-on-surface">{previousLaunch.holder_count || 'Not reported'}</p>
                  </div>
                </div>

                <Link to={`/dashboard/user/launch/${btoa(previousLaunch.id)}`} className="secondary-button text-xs w-full mt-6 text-center">
                  Audit Proof of Work <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                </Link>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center py-10">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">history</span>
                <h3 className="text-lg font-bold text-on-surface mb-2">No previous launch yet</h3>
                <p className="text-xs text-on-surface-variant max-w-[200px]">Completed launches will show up here once archived.</p>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-3xl p-6 md:p-8 border-outline-variant"
      >
        <div className="flex items-end justify-between border-b border-outline-variant pb-4 mb-4">
          <div>
            <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Platform updates</p>
            <h2 className="text-xl font-bold text-on-surface font-display">Latest news</h2>
          </div>
          <Link to="/dashboard/user/news" className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1 text-sm font-semibold">View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span></Link>
        </div>

        <div className="divide-y divide-outline-variant">
          {news.length > 0 ? news.map((item) => (
            <Link to={`/dashboard/user/news/${item.slug}`} key={item.id} className="flex items-center justify-between py-4 group first:pt-2 last:pb-2">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{item.category || 'Update'}</span>
                  <span className="text-[10px] text-on-surface-variant/30">•</span>
                  <span className="text-[10px] font-mono text-on-surface-variant">{item.published_at ? new Date(item.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}</span>
                </div>
                <p className="truncate text-base font-medium text-on-surface/90 transition-colors group-hover:text-on-surface">{item.title}</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface group-hover:translate-x-1 transition-all text-[20px] ml-4 shrink-0">arrow_forward</span>
            </Link>
          )) : (
            <div className="py-6 text-on-surface-variant text-sm">No platform news posts published yet.</div>
          )}
        </div>
      </motion.section>
    </PageTransition>
  );
}
