import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { motion } from 'framer-motion';
import { fetchCurrentAccess, hasSupabaseConfig, supabase } from '../../lib/supabase';
import { fetchLaunches, formatCountdown, getHiddenLaunchCard } from '../../lib/launchAccess';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function UpcomingLaunches() {
  const [search, setSearch] = useState('');
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [watchlist, setWatchlist] = useState(new Set());
  const isPremium = profile?.access_tier === 'premium' || profile?.is_premium;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (hasSupabaseConfig && supabase) {
        const [{ profile: currentProfile, isPremium: premiumAccess }, { data }] = await Promise.all([
          fetchCurrentAccess(),
          fetchLaunches({ status: 'upcoming' }),
        ]);
        setProfile({
          ...currentProfile,
          access_tier: premiumAccess ? 'premium' : currentProfile?.access_tier || 'free',
          is_premium: premiumAccess,
        });
        setLaunches(data ?? []);
      } else {
        setProfile({ access_tier: 'premium', is_premium: true });
        setLaunches([
          {
            id: 'sample-next-launch',
            name: 'Hidden Wave',
            symbol: 'WAVE',
            chain: 'solana',
            status: 'upcoming',
            risk_level: 'medium',
            launch_at: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
            joined_count: 284,
            teaser_label: 'Next Launch',
            teaser_summary: 'Join the next launch before the project details are revealed.',
          },
        ]);
      }
      setLoading(false);
    };

    load();
  }, []);

  const filtered = launches.filter((launch) => {
    const haystack = `${launch.name || ''} ${launch.symbol || ''}`.toLowerCase();
    return !search || haystack.includes(search.toLowerCase());
  });

  const visibleLaunch = filtered[0];
  const hiddenLaunch = isPremium ? getHiddenLaunchCard(visibleLaunch) : null;

  const toggleWatchlist = (event, launchId) => {
    event.preventDefault();
    const next = new Set(watchlist);
    if (next.has(launchId)) next.delete(launchId);
    else next.add(launchId);
    setWatchlist(next);
  };

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-red to-primary tracking-tight mb-2">Upcoming Launches</h1>
          <p className="text-on-surface-variant text-sm">
            {isPremium
              ? 'Premium members see the next launch, the timer, and the live join count without the coin being revealed.'
              : 'Free members only see the public archive. Upgrade to see the next launch without its identity revealed.'}
          </p>
        </div>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 gap-2 focus-within:border-primary/50 transition-all flex-1 md:flex-none md:w-64">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects..."
            className="bg-transparent border-none focus:ring-0 p-0 text-[13px] text-white placeholder:text-on-surface-variant/50 outline-none w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : !isPremium ? (
        <div className="glass-card p-10 rounded-[2rem] border-white/5 hover:border-white/10 transition-all duration-300 shadow-xl bg-[#0a0a0a]/50 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
          <span className="material-symbols-outlined text-5xl text-primary mb-4">workspace_premium</span>
          <h3 className="text-2xl text-white font-bold mb-2">Premium launches are locked</h3>
          <p className="text-on-surface-variant max-w-2xl mx-auto mb-6">
            Free members only see the public archive. Premium members see the next launch card with the countdown and joined count, but not the coin identity.
          </p>
          <Link to="/dashboard/user/previous" className="inline-flex bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-mono text-sm transition-colors mt-2">
            Browse Past Coins
          </Link>
        </div>
      ) : (
        <>
          {hiddenLaunch && (
            <div className="glass-card p-8 rounded-[2rem] border border-neon-red/20 hover:border-neon-red/40 bg-[#0a0a0a]/50 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-lg shadow-neon-red/5 hover:shadow-neon-red/10 transition-all duration-500 relative overflow-hidden group hover:-translate-y-1">
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-neon-red/10 blur-[100px] rounded-full group-hover:bg-neon-red/20 transition-colors pointer-events-none"></div>
              <div>
                <span className="bg-neon-red/10 border border-neon-red/30 text-neon-red px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest">{hiddenLaunch.title}</span>
                <h2 className="text-3xl text-on-surface font-display font-bold mt-4 mb-2">Join the next launch</h2>
                <p className="text-on-surface-variant max-w-2xl">{hiddenLaunch.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 min-w-[280px]">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="font-mono text-[10px] text-on-surface-variant mb-1">COUNTDOWN</p>
                  <p className="text-primary text-lg font-bold">{hiddenLaunch.countdown}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="font-mono text-[10px] text-on-surface-variant mb-1">JOINED</p>
                  <p className="text-white text-lg font-bold">{hiddenLaunch.joined_count}</p>
                </div>
              </div>
            </div>
          )}

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filtered.map((launch) => (
              <motion.div key={launch.id} variants={itemVariants} className="glass-card p-6 rounded-2xl border-white/5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-primary/10 flex flex-col justify-between relative group bg-[#0a0a0a]/40 overflow-hidden">
                <button
                  onClick={(event) => toggleWatchlist(event, launch.id)}
                  className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <span className={`material-symbols-outlined text-[18px] transition-colors ${watchlist.has(launch.id) ? 'text-primary fill-current' : 'text-white/50'}`}>
                    star
                  </span>
                </button>

                <div>
                  <div className="flex items-center gap-4 mb-4">
                    {launch.logo_url && !launch.is_teaser ? (
                      <img src={launch.logo_url} alt={launch.name} className="w-12 h-12 rounded-xl object-cover shadow-lg border border-white/10" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-lg border border-white/5 text-white font-bold">
                        {(launch.is_teaser ? '?' : launch.symbol?.[0]) || '•'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-display text-base text-white font-bold leading-tight truncate max-w-[150px]">
                        {launch.is_teaser ? 'Next Launch' : launch.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant font-mono">
                        {launch.is_teaser ? '$????' : `$${launch.symbol}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-primary/20 text-primary">
                      {launch.status}
                    </span>
                    <span className="bg-white/5 text-on-surface-variant px-2 py-0.5 rounded font-mono text-[10px]">{launch.chain}</span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                      launch.risk_level === 'high' ? 'bg-red-400/20 text-red-400'
                        : launch.risk_level === 'medium' ? 'bg-yellow-400/20 text-yellow-400'
                          : 'bg-green-400/20 text-green-400'
                    }`}>
                      {(launch.risk_level || 'medium').toUpperCase()} RISK
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 mt-auto">
                  {/* Redesigned 3-column stats displaying Joined Count for Premium members */}
                  <div className="grid grid-cols-3 gap-2 items-center mb-4">
                    <div>
                      <p className="font-mono text-[9px] text-on-surface-variant mb-0.5 uppercase">LAUNCH DATE</p>
                      <p className="text-[11px] text-white font-medium">{launch.launch_at ? new Date(launch.launch_at).toLocaleDateString() : 'TBA'}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-[9px] text-on-surface-variant mb-0.5 uppercase">JOINED</p>
                      <p className="text-sm text-primary font-bold">{launch.joined_count ?? 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[9px] text-on-surface-variant mb-0.5 uppercase">COUNTDOWN</p>
                      <p className="text-[11px] text-white font-bold">{formatCountdown(launch.launch_at)}</p>
                    </div>
                  </div>

                  <Link to={`/dashboard/user/launch/${launch.id}`} className="w-full block text-center bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-mono text-xs transition-colors border border-white/10 relative overflow-hidden group-hover:border-primary/30">
                    <span className="relative z-10">Join the Next Launch</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24 glass-card rounded-3xl border-white/5 relative overflow-hidden group">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px]"></div>
              <span className="material-symbols-outlined text-6xl mb-4 text-white/20 relative z-10 group-hover:scale-110 transition-transform duration-500">search_off</span>
              <h3 className="text-2xl font-bold text-white mb-2 relative z-10">No Launches Found</h3>
              <p className="text-on-surface-variant max-w-sm mx-auto">No upcoming launches matched your search query.</p>
            </motion.div>
          )}
        </>
      )}
    </PageTransition>
  );
}
