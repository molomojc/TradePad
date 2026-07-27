import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { fetchCurrentAccess, hasSupabaseConfig, supabase } from '../../lib/supabase';
import { fetchLaunches, formatCountdown, getHiddenLaunchCard } from '../../lib/launchAccess';

export default function DashboardHome() {
  const [userData, setUserData] = useState(null);
  const [nextLaunch, setNextLaunch] = useState(null);
  const [stats, setStats] = useState(null);
  const [featuredLaunch, setFeaturedLaunch] = useState(null);
  const [news, setNews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isPremium = profile?.access_tier === 'premium' || profile?.is_premium;

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      if (hasSupabaseConfig && supabase) {
        const [{ profile: currentProfile, isPremium: premiumAccess }, { data: launches }] = await Promise.all([
          fetchCurrentAccess(),
          fetchLaunches({ status: 'upcoming', limit: 5 }),
        ]);
        setProfile({
          ...currentProfile,
          access_tier: premiumAccess ? 'premium' : currentProfile?.access_tier || 'free',
          is_premium: premiumAccess,
        });
        setUserData({ name: currentProfile?.full_name || 'User' });
        const next = launches?.[0] || null;
        setNextLaunch(premiumAccess && next ? getHiddenLaunchCard(next) : null);
        setFeaturedLaunch(premiumAccess ? next : null);
        setStats([
          { icon: 'workspace_premium', label: 'Access', value: currentProfile?.access_tier || 'free' },
          { icon: 'history', label: 'Archive', value: 'Available' },
          { icon: 'lock', label: 'Launches', value: premiumAccess ? (next ? formatCountdown(next.launch_at) : 'TBA') : 'Hidden' },
        ]);
        setNews([]);
      } else {
        setUserData({ name: 'Jacob' });
        setProfile({ access_tier: 'premium', is_premium: true });
        const sample = {
          id: 'sample-next-launch',
          title: 'Next Launch',
          subtitle: 'Join the next launch before the project details are revealed.',
          countdown: '1d 12h',
          joined_count: 284,
        };
        setNextLaunch(sample);
        setFeaturedLaunch({
          id: 'sample-next-launch',
          name: 'Hidden Wave',
          chain: 'solana',
          risk_level: 'medium',
          status: 'upcoming',
          current_mc: 'Hidden',
          liquidity: 'Hidden',
          holders: '284 joined',
        });
        setStats([
          { icon: 'rocket_launch', label: 'Next launch', value: sample.countdown },
          { icon: 'group', label: 'Joined count', value: '284' },
          { icon: 'workspace_premium', label: 'Access', value: 'premium' },
        ]);
        setNews([]);
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-6">
      
      {/* Welcome & Next Launch Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl border-white/5 relative overflow-hidden flex flex-col justify-between min-h-[240px]">
          <div className="absolute -top-32 -right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <h1 className="text-3xl font-display-lg font-bold text-white mb-2">Welcome back, {userData?.name || 'User'}</h1>
            <p className="text-on-surface-variant max-w-md">
              {isPremium
                ? 'Premium members see the next launch card, the timer, and the join count before the coin is revealed.'
                : 'Free members stay in the archive only. Launch details are hidden until you upgrade.'}
            </p>
          </div>
          <div className="mt-8 flex gap-4">
            <Link to="/dashboard/user/upcoming" className="bg-primary text-black px-6 py-3 rounded-full font-label-mono font-bold text-sm shadow-[0_0_15px_rgba(198,198,198,0.1)] hover:opacity-90 transition-all active:scale-95">
              {isPremium ? 'Explore Launches' : 'View Archive'}
            </Link>
          </div>
        </div>

        {/* Next Launch Card */}
        {isPremium && nextLaunch ? (
          <div className="glass-card p-6 rounded-3xl border-white/5 relative bg-gradient-to-br from-white/5 to-transparent flex flex-col items-center justify-center text-center group border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-label-mono text-[10px] mb-4">{nextLaunch.title}</span>
            <div className="w-16 h-16 rounded-full bg-white/10 mb-3 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              ?
            </div>
            <h3 className="font-headline-md text-white font-bold text-lg mb-1">Join the next launch</h3>
            <p className="text-on-surface-variant text-sm mb-1">Launches in <span className="text-white font-bold">{nextLaunch.countdown}</span></p>
            <p className="text-on-surface-variant text-xs mb-4">{nextLaunch.joined_count} members already joined</p>
            <Link to={`/dashboard/user/launch/${nextLaunch.id}`} className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl font-label-mono text-xs transition-colors">
              Join the Next Launch
            </Link>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-3xl border-dashed border-2 border-white/10 relative flex flex-col items-center justify-center text-center group transition-colors">
            <span className="material-symbols-outlined text-4xl text-white/20 mb-3 group-hover:rotate-12 transition-transform">hourglass_empty</span>
            <h3 className="font-headline-md text-white font-bold text-lg mb-1">Brewing Something Big</h3>
            <p className="text-on-surface-variant text-[13px]">Our scouts are validating the next premium launch.</p>
          </div>
        )}
      </div>

      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats && stats.map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border-white/5 flex items-center gap-4 hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <p className="font-label-mono text-[11px] text-on-surface-variant uppercase tracking-wider">{stat.label}</p>
              <h4 className="font-display-lg text-2xl text-white font-bold">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Featured Launch & News */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-xl text-white font-bold">Featured Launch</h2>
            <Link to="/dashboard/user/upcoming" className="text-primary text-sm font-label-mono hover:opacity-80">View All</Link>
          </div>
          
        {isPremium && featuredLaunch ? (
          <div className="glass-card p-6 rounded-3xl border-white/5 group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-2xl shadow-lg group-hover:scale-105 transition-transform">
                    {featuredLaunch.icon}
                  </div>
                  <div>
                    <h3 className="font-display-lg text-2xl text-white font-bold">{featuredLaunch.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-white/10 text-on-surface-variant px-2 py-0.5 rounded-full font-label-mono text-[10px]">{featuredLaunch.chain}</span>
                      <span className="bg-red-400/20 text-red-400 px-2 py-0.5 rounded-full font-label-mono text-[10px]">{featuredLaunch.risk_level}</span>
                    </div>
                  </div>
                </div>
                <span className="bg-green-400/20 text-green-400 px-3 py-1 rounded-full font-label-mono text-[11px] font-bold">{featuredLaunch.status}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">STATUS</p>
                  <p className="font-headline-md text-white text-sm font-bold">Hidden</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">COUNTDOWN</p>
                  <p className="font-headline-md text-white text-sm font-bold">{formatCountdown(featuredLaunch.launch_at)}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">JOINED</p>
                  <p className="font-headline-md text-white text-sm font-bold">{featuredLaunch.joined_count ?? 0}</p>
                </div>
              </div>
              
              <Link to={`/dashboard/user/launch/${featuredLaunch.id}`} className="w-full block text-center bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-label-mono text-sm transition-colors border border-white/10 hover:border-white/20 relative overflow-hidden">
                <span className="relative z-10">View Full Analysis</span>
              </Link>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl border-white/5 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-white/20 text-3xl">radar</span>
              </div>
              <h3 className="font-display-lg text-xl text-white font-bold mb-2">Scanning for Gems</h3>
              <p className="text-on-surface-variant text-sm max-w-xs">
                {isPremium
                  ? 'There are no featured launches at the moment. Keep your eyes peeled for upcoming drops.'
                  : 'Your dashboard is focused on the archive. Upgrade to unlock the next launch card.'}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Premium & Mini-News */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border-primary/30 relative overflow-hidden bg-gradient-to-b from-primary/10 to-transparent">
            <div className="absolute top-0 right-0 p-4">
              <span className="material-symbols-outlined text-primary text-4xl opacity-20">star</span>
            </div>
            <h3 className="font-headline-md text-white font-bold text-lg mb-2">Unlock Premium</h3>
            <p className="text-on-surface-variant text-sm mb-6">Get access to in-depth research, AI tokenomics scores, and early alerts.</p>
            <Link to="/dashboard/user/premium" className="block text-center bg-primary text-black py-2.5 rounded-xl font-label-mono font-bold text-sm shadow-[0_0_15px_rgba(198,198,198,0.2)] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(198,198,198,0.3)] transition-all">
              Upgrade Now
            </Link>
          </div>

          <div className="glass-card p-6 rounded-3xl border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-md text-white font-bold">Latest News</h3>
            </div>
            <div className="space-y-4">
              {news.length > 0 ? (
                news.map((n) => (
                  <div key={n.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0 group cursor-pointer">
                    <span className="text-[10px] font-label-mono text-primary mb-1 block">{n.tag}</span>
                    <p className="text-sm text-white group-hover:text-primary transition-colors line-clamp-2">{n.title}</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">{n.time}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <span className="material-symbols-outlined text-3xl text-white/10 mb-2">newspaper</span>
                  <p className="text-on-surface-variant text-xs">No recent updates.</p>
                </div>
              )}
            </div>
            <Link to="/dashboard/user/news" className="block text-center text-primary font-label-mono text-xs mt-4 hover:opacity-80">Read all news</Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
