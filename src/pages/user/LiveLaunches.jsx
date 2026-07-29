import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { motion } from 'framer-motion';
import { fetchCurrentAccess, hasSupabaseConfig, supabase } from '../../lib/supabase';
import { fetchLaunches } from '../../lib/launchAccess';
import Skeleton from '../../components/Skeleton';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

function LiveLaunchCard({ launch, isPremium, watchlist, toggleWatchlist }) {
  const launchTime = launch.launch_at ? new Date(launch.launch_at).getTime() : 0;
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (!launchTime) return;
    const update = () => {
      const timePast = Date.now() - launchTime;
      const buffer = 15 * 60 * 1000;
      const remaining = Math.max(0, Math.ceil((buffer - timePast) / 1000));
      setSecondsRemaining(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [launchTime]);

  const isBufferActive = secondsRemaining > 0;
  const showTeaser = isBufferActive && !isPremium;

  return (
    <motion.div 
      variants={itemVariants} 
      whileHover={{ scale: 1.02, y: -4 }}
      className={`glass-card p-6 rounded-2xl border-outline-variant shadow-lg flex flex-col justify-between relative group bg-[#0a0a0a]/40 overflow-hidden ${showTeaser ? 'hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]'}`}
    >
      <button
        onClick={(event) => toggleWatchlist(event, launch)}
        className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center border border-outline-variant hover:bg-surface transition-colors"
      >
        <span className={`material-symbols-outlined text-[18px] transition-colors ${watchlist.has(launch.id) ? (showTeaser ? 'text-amber-400 fill-current' : 'text-emerald-400 fill-current') : 'text-on-surface-variant'}`}>
          star
        </span>
      </button>

      <div>
        <div className="flex items-center gap-4 mb-4">
          {launch.logo_url && !showTeaser ? (
            <img src={launch.logo_url} alt={launch.name} className="w-12 h-12 rounded-xl object-cover shadow-lg border border-outline-variant shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-xl shadow-lg text-on-surface font-bold shrink-0">
              {showTeaser ? '🔒' : (launch.symbol || 'L').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-display text-base text-on-surface font-bold leading-tight truncate max-w-[150px]">
              {showTeaser ? '•••••••••••••' : launch.name}
            </h3>
            <p className="text-xs text-on-surface-variant font-mono">
              {showTeaser ? '$????' : `$${launch.symbol}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold border uppercase tracking-wider ${showTeaser ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 animate-pulse'}`}>
            {showTeaser ? 'Locked' : 'Live'}
          </span>
          <span className="bg-surface border border-outline-variant text-on-surface-variant px-2 py-0.5 rounded font-mono text-[10px]">{showTeaser ? '🔒 Locked' : (launch.chain || 'solana')}</span>
          <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
            showTeaser ? 'bg-amber-400/20 text-amber-400' :
            launch.risk_level === 'high' ? 'bg-red-400/20 text-red-400' :
            launch.risk_level === 'medium' ? 'bg-yellow-400/20 text-yellow-400' :
            'bg-green-400/20 text-green-400'
          }`}>
            {showTeaser ? 'LOCKED RISK' : (launch.risk_level || 'medium').toUpperCase() + ' RISK'}
          </span>
        </div>
        
        <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed mb-6">
          {showTeaser ? 'Premium Early Access. Full metrics and trading logs unlock to the public after the early access window.' : (launch.description || 'Active live pool claim allocations and real-time metrics auditing.')}
        </p>
      </div>

      <div className="border-t border-outline-variant pt-4 mt-auto">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="font-mono text-[9px] text-on-surface-variant mb-0.5 uppercase">TARGET RAISE</p>
            <p className="text-sm text-on-surface font-bold font-mono">{showTeaser ? '🔒 Locked' : (launch.target_raise || 'TBA')}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] text-on-surface-variant mb-0.5 uppercase">UNLOCKS IN</p>
            <p className={`text-sm font-bold font-mono ${showTeaser ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
              {showTeaser ? `${Math.floor(secondsRemaining / 60)}:${(secondsRemaining % 60).toString().padStart(2, '0')}` : 'Public'}
            </p>
          </div>
        </div>

        {showTeaser ? (
          <Link to="/dashboard/user/premium" className="w-full block text-center bg-amber-500 hover:bg-amber-600 text-black py-3 rounded-xl font-mono text-xs font-bold transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            Unlock Now
          </Link>
        ) : (
          <Link to={`/dashboard/user/launch/${launch.id}`} className="w-full block text-center bg-emerald-500 text-black py-3 rounded-xl font-mono text-xs font-bold transition-colors shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:bg-emerald-600">
            Enter Launchroom
          </Link>
        )}
      </div>
    </motion.div>
  );
}

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

  const toggleWatchlist = (event, launch) => {
    event.preventDefault();
    const next = new Set(watchlist);
    if (next.has(launch.id)) {
      next.delete(launch.id);
      toast.info(`Removed ${launch.name} from watchlist`);
    } else {
      next.add(launch.id);
      toast.success(`Added ${launch.name} to watchlist`);
    }
    setWatchlist(next);
  };

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-tight mb-2">Live Launches</h1>
          <p className="text-on-surface-variant text-sm">
            View active memecoin pools, claim allocations, and monitor trading metrics.
          </p>
        </div>
        <div className="flex items-center bg-surface border border-outline-variant rounded-xl px-3 py-2 gap-2 focus-within:border-emerald-500/55 transition-all flex-1 md:flex-none md:w-64">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search live projects..."
            className="bg-transparent border-none focus:ring-0 p-0 text-[13px] text-on-surface placeholder:text-on-surface-variant/50 outline-none w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[340px] w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 rounded-[2rem] border-outline-variant text-center bg-[#0a0a0a]/40">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">history_toggle_off</span>
          <h3 className="text-xl text-on-surface font-bold mb-2">No launches active right now</h3>
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
            <LiveLaunchCard
              key={launch.id}
              launch={launch}
              isPremium={isPremium}
              watchlist={watchlist}
              toggleWatchlist={toggleWatchlist}
            />
          ))}
        </motion.div>
      )}
    </PageTransition>
  );
}
