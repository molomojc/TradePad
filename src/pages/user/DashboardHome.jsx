import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { fetchCurrentAccess, hasSupabaseConfig, supabase } from '../../lib/supabase';
import { fetchLaunches } from '../../lib/launchAccess';

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({ days: '00', hrs: '00', min: '00', sec: '00' });

  useEffect(() => {
    const update = () => {
      const distance = targetDate ? Math.max(new Date(targetDate).getTime() - Date.now(), 0) : 0;
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
  const launchDate = nextLaunch?.launch_at ? new Date(nextLaunch.launch_at) : null;
  const isLaunchDay = launchDate ? new Date().toDateString() === launchDate.toDateString() : false;
  const launchName = nextLaunch?.title || nextLaunch?.name || 'Next launch';
  const firstName = userData?.name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <PageTransition className="flex min-h-[65vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-on-surface/50">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
          <span className="dashboard-label">Loading workspace</span>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto w-full max-w-[1440px] space-y-6 pb-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-mono text-on-surface-variant uppercase tracking-wider">
            <span>Workspace</span><span>/</span><span className="text-white">Overview</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white sm:text-4xl mt-2 mb-2">Good evening, {firstName}</h1>
          <p className="text-on-surface-variant max-w-md">Discover the next generation of premium, vetted community memecoin launches.</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono text-white sm:self-auto shadow-lg">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.6)] animate-pulse" />
          All systems operational
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.75fr)]">
        <div className="space-y-6">
          {/* Live Launch Card (pulsing active pool dashboard) */}
          {liveLaunch && (
            <div className="glass-card rounded-3xl overflow-hidden relative">
              <div className="flex flex-col gap-4 border-b border-white/[0.07] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative z-10">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live Now
                    </span>
                    {isPremium && <span className="inline-flex items-center px-2 py-1 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold tracking-wider uppercase">Premium access</span>}
                  </div>
                  <h2 className="text-2xl font-bold text-white font-display">{liveLaunch.name}</h2>
                </div>
                <Link to={`/dashboard/user/launch/${liveLaunch.id}`} className="secondary-button shrink-0 relative z-10 text-xs">Participate Live <span className="material-symbols-outlined text-[16px]">arrow_outward</span></Link>
              </div>

              {isPremium ? (
                <div className="p-6 relative z-10">
                  <div className="launch-panel relative overflow-hidden rounded-2xl border border-emerald-500/20 p-6 bg-emerald-500/5 shadow-inner">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] pointer-events-none"></div>
                    
                    <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                      <div>
                        <p className="dashboard-label text-emerald-400">ACTIVE POOL TARGET</p>
                        <h3 className="text-2xl font-bold text-white mt-2 font-display">{liveLaunch.target_raise || 'TBA'}</h3>
                        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed max-w-md">
                          {liveLaunch.description || 'This vetted Solana project is currently live. Whitelist entries are closed, pool claims and DEX liquidity lockup are underway.'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                        <div>
                          <p className="dashboard-label mb-2">Symbol</p>
                          <p className="text-xl font-bold text-white font-mono">${liveLaunch.symbol}</p>
                        </div>
                        <div>
                          <p className="dashboard-label mb-2">Participants</p>
                          <p className="text-xl font-bold text-white font-mono">{liveLaunch.joined_count || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px] text-emerald-400 animate-pulse">check_circle</span> 
                      Pool participation is active.
                    </p>
                    <Link to={`/dashboard/user/launch/${liveLaunch.id}`} className="primary-button text-xs bg-emerald-400 hover:bg-emerald-500 text-black shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                      Participate Live <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-primary/5 to-transparent relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
                  
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative z-10">
                    <span className="material-symbols-outlined text-3xl text-primary drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">lock</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 relative z-10 font-display">Unlock live launches</h3>
                  <p className="max-w-md text-sm text-on-surface-variant leading-relaxed mb-8 relative z-10">Upgrade to Premium for live launch details, priority windows, and allocation access before the public.</p>
                  <Link to="/dashboard/user/premium" className="bg-primary text-black px-8 py-3 rounded-xl font-mono font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition-transform relative z-10">
                    Explore Premium
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Launch Card */}
          <div className="glass-card rounded-3xl overflow-hidden relative">
            <div className="flex flex-col gap-4 border-b border-white/[0.07] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-mono font-bold tracking-wider uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Upcoming
                  </span>
                  {isPremium && <span className="inline-flex items-center px-2 py-1 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold tracking-wider uppercase">Premium access</span>}
                </div>
                <h2 className="text-2xl font-bold text-white font-display">{isLaunchDay ? launchName : 'Next launch'}</h2>
              </div>
              <Link to="/dashboard/user/upcoming" className="secondary-button shrink-0 relative z-10 text-xs">View details <span className="material-symbols-outlined text-[16px]">arrow_outward</span></Link>
            </div>

            {isPremium ? (
              nextLaunch ? (
                <div className="p-6 relative z-10">
                  <div className="launch-panel relative overflow-hidden rounded-2xl border border-white/10 p-6 bg-white/5 shadow-inner">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none"></div>
                    
                    <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                      <div>
                        <p className="dashboard-label">{isLaunchDay ? 'Launching today' : 'Next launch in'}</p>
                        <div className="mt-4 flex items-start gap-3">
                          {[
                            ['Days', countdown.days], ['Hours', countdown.hrs], ['Minutes', countdown.min], ['Seconds', countdown.sec],
                          ].map(([label, value]) => (
                            <div key={label} className="min-w-0 flex-1 sm:flex-none">
                              <div className="text-3xl md:text-4xl font-mono font-bold text-white">{value}</div>
                              <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 border-t border-white/[0.08] pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                        <div><p className="dashboard-label mb-2">Participants</p><p className="text-2xl font-bold text-white">{nextLaunch.joined_count || 0}</p></div>
                        <div><p className="dashboard-label mb-2">Target raise</p><p className="text-2xl font-bold text-white">{nextLaunch.target_raise || 'TBA'}</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-[18px] text-primary">lock</span> Your priority allocation window is reserved.</p>
                    <Link to="/dashboard/user/upcoming" className="primary-button text-xs">Review launch <span className="material-symbols-outlined text-[17px]">arrow_forward</span></Link>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-primary/5 to-transparent relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
                  <span className="material-symbols-outlined text-4xl text-white/20 mb-2 block font-display">history_toggle_off</span>
                  <h3 className="text-xl font-bold text-white mb-2 relative z-10 font-display">No Launches Scheduled</h3>
                  <p className="max-w-sm text-on-surface-variant text-sm relative z-10">Check back later for upcoming Solana memecoin drops.</p>
                </div>
              )
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-primary/5 to-transparent relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
                
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative z-10">
                  <span className="material-symbols-outlined text-3xl text-primary drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">lock</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 relative z-10 font-display">Unlock upcoming launches</h3>
                <p className="max-w-md text-sm text-on-surface-variant leading-relaxed mb-8 relative z-10">Upgrade to Premium for live launch details, priority windows, and allocation access before the public.</p>
                <Link to="/dashboard/user/premium" className="bg-primary text-black px-8 py-3 rounded-xl font-mono font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition-transform relative z-10">
                  Explore Premium
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-3xl flex flex-col overflow-hidden border-white/5 relative">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none"></div>
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-6 py-6 relative z-10">
            <div>
              <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Launch archive</p>
              <h2 className="text-xl font-bold text-white font-display">Previous launch</h2>
            </div>
            <Link to="/dashboard/user/previous" className="text-on-surface-variant hover:text-white transition-colors flex items-center gap-1 text-sm font-semibold">View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span></Link>
          </div>

          <div className="flex-1 p-6 relative z-10">
            {previousLaunch ? (
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-bold text-white shadow-inner">
                    {(previousLaunch.symbol || 'L').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="truncate text-xl font-bold text-white">{previousLaunch.name || previousLaunch.title}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded border border-white/20 bg-white/10 text-white text-[9px] font-mono font-bold tracking-wider uppercase">{previousLaunch.status || 'Completed'}</span>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                      {previousLaunch.launch_at ? new Date(previousLaunch.launch_at).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-6 mt-6">
                  <div>
                    <p className="dashboard-label mb-1">Market Cap</p>
                    <p className="text-lg font-bold text-white">{previousLaunch.market_cap || 'Not reported'}</p>
                  </div>
                  <div>
                    <p className="dashboard-label mb-1">Liquidity</p>
                    <p className="text-lg font-bold text-white">{previousLaunch.liquidity || 'Not reported'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="dashboard-label mb-1">Total Holders</p>
                    <p className="text-base font-bold text-white">{previousLaunch.holder_count || 'Not reported'}</p>
                  </div>
                </div>

                <Link to={`/dashboard/user/launch/${previousLaunch.id}`} className="secondary-button text-xs w-full mt-6 text-center">
                  Audit Proof of Work <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                </Link>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center py-10">
                <span className="material-symbols-outlined text-4xl text-white/25 mb-2">history</span>
                <h3 className="text-lg font-bold text-white mb-2">No previous launch yet</h3>
                <p className="text-xs text-on-surface-variant max-w-[200px]">Completed launches will show up here once archived.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="glass-card rounded-3xl p-6 md:p-8 border-white/5">
        <div className="flex items-end justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Platform updates</p>
            <h2 className="text-xl font-bold text-white font-display">Latest news</h2>
          </div>
          <Link to="/dashboard/user/news" className="text-on-surface-variant hover:text-white transition-colors flex items-center gap-1 text-sm font-semibold">View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span></Link>
        </div>

        <div className="divide-y divide-white/5">
          {news.length > 0 ? news.map((item) => (
            <Link to={`/dashboard/user/news/${item.slug}`} key={item.id} className="flex items-center justify-between py-4 group first:pt-2 last:pb-2">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{item.category || 'Update'}</span>
                  <span className="text-[10px] text-white/20">•</span>
                  <span className="text-[10px] font-mono text-on-surface-variant">{item.published_at ? new Date(item.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}</span>
                </div>
                <p className="truncate text-base font-medium text-white/90 transition-colors group-hover:text-white">{item.title}</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-white group-hover:translate-x-1 transition-all text-[20px] ml-4 shrink-0">arrow_forward</span>
            </Link>
          )) : (
            <div className="py-6 text-on-surface-variant text-sm">No platform news posts published yet.</div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
