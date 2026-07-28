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

const fallbackNews = [
  { id: '1', title: 'New staking tiers are now live', category: 'Platform', published_at: new Date().toISOString(), slug: 'tradepad-10000-launches' },
  { id: '2', title: 'Independent security audit completed', category: 'Security', published_at: new Date(Date.now() - 86400000).toISOString(), slug: 'conviction-scoring-v2' },
  { id: '3', title: 'Community AMA scheduled for tomorrow', category: 'Community', published_at: new Date(Date.now() - 172800000).toISOString(), slug: 'scheduled-maintenance' },
];

export default function DashboardHome() {
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextLaunch, setNextLaunch] = useState(null);
  const [previousLaunch, setPreviousLaunch] = useState(null);
  const [news, setNews] = useState([]);
  const isPremium = profile?.access_tier === 'premium' || profile?.is_premium;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (hasSupabaseConfig && supabase) {
          const [{ profile: currentProfile, isPremium: premiumAccess }, { data: upcoming }, { data: completed }] = await Promise.all([
            fetchCurrentAccess(),
            fetchLaunches({ status: 'upcoming', limit: 1 }),
            supabase.from('launches').select('*').in('status', ['closed', 'archived']).order('launch_at', { ascending: false }).limit(1),
          ]);
          setProfile({ ...currentProfile, access_tier: premiumAccess ? 'premium' : currentProfile?.access_tier || 'free', is_premium: premiumAccess });
          setUserData({ name: currentProfile?.full_name || 'User' });
          setNextLaunch(upcoming?.[0] || null);
          setPreviousLaunch(completed?.[0] || null);
          const { data } = await supabase.from('news_posts').select('*').not('published_at', 'is', null).order('published_at', { ascending: false }).limit(3);
          setNews(data?.length ? data : fallbackNews);
        } else {
          setUserData({ name: 'Jacob' });
          setProfile({ access_tier: 'premium', is_premium: true });
          setNextLaunch({ id: 'sample-next-launch', title: 'Aether Protocol', launch_at: new Date(Date.now() + 93720000).toISOString(), joined_count: 284, target_raise: '$750,000' });
          setPreviousLaunch({ id: 'archive-1', name: 'Old Wave', symbol: 'OWV', status: 'archived', launch_at: '2026-06-18T12:00:00.000Z', market_cap: '$1.2M', liquidity: '$180K', holder_count: '2,410' });
          setNews(fallbackNews);
        }
      } catch (error) {
        console.error(error);
        setNews(fallbackNews);
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
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-neon-red" />
          <span className="dashboard-label">Loading workspace</span>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto w-full max-w-[1440px] space-y-6 pb-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-on-surface/45">
            <span>Workspace</span><span>/</span><span className="text-on-surface/75">Overview</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-on-surface sm:text-4xl">Good evening, {firstName}</h1>
          <p className="mt-2 text-sm text-on-surface/50">Track the next coin release and stay up to date with launch news.</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-on-surface/55 sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.6)]" />
          All systems operational
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.75fr)]">
        <div className="dashboard-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="dashboard-badge dashboard-badge-live"><span className="h-1.5 w-1.5 rounded-full bg-neon-red" /> Upcoming</span>
                {isPremium && <span className="dashboard-badge">Premium access</span>}
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-on-surface">{isLaunchDay ? launchName : 'Next launch'}</h2>
            </div>
            <Link to="/dashboard/user/upcoming" className="secondary-button">View details <span className="material-symbols-outlined text-[17px]">arrow_outward</span></Link>
          </div>

          {isPremium && nextLaunch ? (
            <div className="p-5 sm:p-7">
              <div className="launch-panel relative overflow-hidden rounded-xl border border-white/[0.08] p-5 sm:p-7">
                <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <p className="dashboard-label">{isLaunchDay ? 'Launching today' : 'Next launch in'}</p>
                    <div className="mt-4 flex items-start gap-2 sm:gap-3">
                      {[
                        ['Days', countdown.days], ['Hours', countdown.hrs], ['Minutes', countdown.min], ['Seconds', countdown.sec],
                      ].map(([label, value]) => (
                        <div key={label} className="min-w-0 flex-1 sm:flex-none">
                          <div className="countdown-unit">{value}</div>
                          <div className="mt-2 text-center text-[9px] font-semibold uppercase tracking-[0.15em] text-on-surface/35 sm:text-[10px]">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 border-t border-white/[0.08] pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                    <div><p className="dashboard-label">Participants</p><p className="mt-2 text-lg font-semibold">{nextLaunch.joined_count || 0}</p></div>
                    <div><p className="dashboard-label">Target raise</p><p className="mt-2 text-lg font-semibold">{nextLaunch.target_raise || 'TBA'}</p></div>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs text-on-surface/45"><span className="material-symbols-outlined text-[16px]">lock</span> Your priority allocation window is reserved.</p>
                <Link to="/dashboard/user/upcoming" className="primary-button">Review launch <span className="material-symbols-outlined text-[17px]">arrow_forward</span></Link>
              </div>
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <div className="metric-icon metric-icon-accent"><span className="material-symbols-outlined">lock</span></div>
              <h3 className="mt-4 text-lg font-semibold">Unlock upcoming launches</h3>
              <p className="mt-2 max-w-md text-sm text-on-surface/45">Upgrade to Premium for live launch details, priority windows, and allocation access.</p>
              <Link to="/dashboard/user/premium" className="primary-button mt-5">Explore Premium</Link>
            </div>
          )}
        </div>

        <div className="dashboard-card flex flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-7">
            <div>
              <p className="dashboard-label">Launch archive</p>
              <h2 className="mt-2 text-xl font-semibold">Previous launch</h2>
            </div>
            <Link to="/dashboard/user/previous" className="text-link">View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span></Link>
          </div>

          {previousLaunch ? (
            <div className="flex flex-1 flex-col p-5 sm:p-7">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-neon-red/20 bg-neon-red/[0.08] text-base font-bold text-neon-red">
                  {(previousLaunch.symbol || previousLaunch.name || 'L').slice(0, 3).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-semibold text-on-surface">{previousLaunch.name || previousLaunch.title}</h3>
                    <span className="dashboard-badge">{previousLaunch.status || 'Completed'}</span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-on-surface/40">
                    <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                    Launched {previousLaunch.launch_at ? new Date(previousLaunch.launch_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}
                  </p>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="dashboard-label">Market cap</p>
                  <p className="mt-2 text-base font-semibold text-on-surface">{previousLaunch.market_cap || 'Not reported'}</p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="dashboard-label">Liquidity</p>
                  <p className="mt-2 text-base font-semibold text-on-surface">{previousLaunch.liquidity || 'Not reported'}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-5">
                <div>
                  <p className="dashboard-label">Holders</p>
                  <p className="mt-2 text-sm font-semibold text-on-surface">{previousLaunch.holder_count || 'Not reported'}</p>
                </div>
                <Link to={`/dashboard/user/launch/${previousLaunch.id}`} className="secondary-button">Launch report <span className="material-symbols-outlined text-[17px]">arrow_outward</span></Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="metric-icon"><span className="material-symbols-outlined">history</span></div>
              <h3 className="mt-4 text-base font-semibold">No previous launch yet</h3>
              <p className="mt-2 text-sm text-on-surface/40">The most recent completed coin launch will appear here.</p>
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-card p-5 sm:p-7">
        <div className="section-heading"><div><p className="dashboard-label">Market brief</p><h2 className="mt-2 text-xl font-semibold">Latest updates</h2></div><Link to="/dashboard/user/news" className="text-link">View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span></Link></div>
        <div className="mt-4 divide-y divide-white/[0.06]">
          {news.map((item) => (
            <Link key={item.id} to={`/dashboard/user/news/${item.slug}`} className="news-row group">
              <div className="min-w-0"><div className="mb-1.5 flex items-center gap-2"><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-neon-red">{item.category || 'Update'}</span><span className="text-[10px] text-on-surface/30">•</span><span className="text-[10px] text-on-surface/35">{item.published_at ? new Date(item.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}</span></div><p className="truncate text-sm font-medium text-on-surface/80 transition-colors group-hover:text-on-surface">{item.title}</p></div>
              <span className="material-symbols-outlined text-[17px] text-on-surface/25 transition-all group-hover:translate-x-1 group-hover:text-neon-red">arrow_forward</span>
            </Link>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
