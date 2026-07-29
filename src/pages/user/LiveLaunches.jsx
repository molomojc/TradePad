import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { motion } from 'framer-motion';
import { fetchCurrentAccess, hasSupabaseConfig, supabase } from '../../lib/supabase';
import { fetchLaunches } from '../../lib/launchAccess';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function LiveLaunches() {
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
          fetchLaunches({ status: 'live' }),
        ]);
        setProfile({
          ...currentProfile,
          access_tier: premiumAccess ? 'premium' : currentProfile?.access_tier || 'free',
          is_premium: premiumAccess,
        });
        setLaunches(data ?? []);
      } else {
        setProfile({ access_tier: 'premium', is_premium: true });
        setLaunches([]);
      }
      setLoading(false);
    };

    load();
  }, []);

  const filtered = launches.filter((launch) => {
    const haystack = `${launch.name || ''} ${launch.symbol || ''}`.toLowerCase();
    return !search || haystack.includes(search.toLowerCase());
  });

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
          <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-tight mb-2">Live Launches</h1>
          <p className="text-on-surface-variant text-sm">
            {isPremium
              ? 'View active memecoin pools, claim allocations, and monitor trading metrics.'
              : 'Upgrade to Premium to view and participate in live token launches.'}
          </p>
        </div>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 gap-2 focus-within:border-emerald-500/55 transition-all flex-1 md:flex-none md:w-64">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search live projects..."
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
          <span className="material-symbols-outlined text-5xl text-emerald-400 mb-4 animate-pulse">sensors</span>
          <h3 className="text-2xl text-white font-bold mb-2">Live launches are locked</h3>
          <p className="text-on-surface-variant max-w-2xl mx-auto mb-6">
            Only Premium members can participate in live pools and audit active launches. Subscribe to unlock immediate priority access.
          </p>
          <Link to="/dashboard/user/premium" className="inline-flex bg-primary text-black px-6 py-3 rounded-xl font-mono text-sm font-bold shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:scale-105 transition-transform">
            Get Premium Access
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 rounded-[2rem] border-white/5 text-center bg-[#0a0a0a]/40">
          <span className="material-symbols-outlined text-5xl text-white/20 mb-4">history_toggle_off</span>
          <h3 className="text-xl text-white font-bold mb-2">No launches active right now</h3>
          <p className="text-on-surface-variant max-w-sm mx-auto mb-6 text-sm">
            All pools are currently closed or waiting for scheduled countdown windows.
          </p>
          <Link to="/dashboard/user/upcoming" className="secondary-button text-xs inline-flex items-center gap-1.5">
            View Upcoming Calendar <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((launch) => (
            <motion.div key={launch.id} variants={itemVariants} className="glass-card p-6 rounded-2xl border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between relative group bg-[#0a0a0a]/40 overflow-hidden">
              <button
                onClick={(event) => toggleWatchlist(event, launch.id)}
                className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
              >
                <span className={`material-symbols-outlined text-[18px] transition-colors ${watchlist.has(launch.id) ? 'text-emerald-400 fill-current' : 'text-white/50'}`}>
                  star
                </span>
              </button>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  {launch.logo_url ? (
                    <img src={launch.logo_url} alt={launch.name} className="w-12 h-12 rounded-xl object-cover shadow-lg border border-white/10" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-lg border border-white/5 text-white font-bold">
                      {(launch.symbol || 'L').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-base text-white font-bold leading-tight truncate max-w-[150px]">{launch.name}</h3>
                    <p className="text-xs text-on-surface-variant font-mono">${launch.symbol}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse uppercase tracking-wider">
                    {launch.status} Now
                  </span>
                  <span className="bg-white/5 text-on-surface-variant px-2 py-0.5 rounded font-mono text-[10px]">{launch.chain || 'solana'}</span>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                    launch.risk_level === 'high' ? 'bg-red-400/20 text-red-400'
                      : launch.risk_level === 'medium' ? 'bg-yellow-400/20 text-yellow-400'
                        : 'bg-green-400/20 text-green-400'
                  }`}>
                    {(launch.risk_level || 'medium').toUpperCase()} RISK
                  </span>
                </div>
                
                <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed mb-6">
                  {launch.description || 'Active live pool claim allocations and real-time metrics auditing.'}
                </p>
              </div>

              <div className="border-t border-white/5 pt-4 mt-auto">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-mono text-[9px] text-on-surface-variant mb-0.5 uppercase">TARGET RAISE</p>
                    <p className="text-sm text-white font-bold font-mono">{launch.target_raise || 'TBA'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9px] text-on-surface-variant mb-0.5 uppercase">PARTICIPANTS</p>
                    <p className="text-sm text-emerald-400 font-bold font-mono">{launch.joined_count ?? 0}</p>
                  </div>
                </div>

                <Link to={`/dashboard/user/launch/${launch.id}`} className="w-full block text-center bg-emerald-500 text-black py-3 rounded-xl font-mono text-xs font-bold transition-colors shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:bg-emerald-600">
                  Enter Launchroom
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageTransition>
  );
}
