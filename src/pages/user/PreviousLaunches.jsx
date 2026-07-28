import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { motion } from 'framer-motion';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function PreviousLaunches() {
  const [search, setSearch] = useState('');
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreviousLaunches = async () => {
      setLoading(true);
      if (hasSupabaseConfig && supabase) {
        const { data } = await supabase
          .from('launches')
          .select('id, name, slug, status, chain, risk_level, launch_at, market_cap, liquidity, holder_count')
          .in('status', ['closed', 'archived'])
          .order('launch_at', { ascending: false });
        setLaunches(data ?? []);
      } else {
        setLaunches([
          { id: 'archive-1', name: 'Old Wave', date: 'Jun 2026', ath: '12x', performance: '+220%', currentMc: '$1.2M', liquidity: '$180K', holders: '2,410' },
        ]);
      }
      setLoading(false);
    };

    fetchPreviousLaunches();
  }, []);

  const filtered = launches.filter((launch) => (launch.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-headline-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-red to-primary tracking-tight mb-2">Previous Launches</h1>
          <p className="text-on-surface-variant text-sm">Explore our archive of past launches and their performance.</p>
        </div>
        
        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 gap-2 focus-within:border-primary/50 transition-all w-full md:w-72">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search past projects..."
            className="bg-transparent border-none focus:ring-0 p-0 text-[13px] text-white placeholder:text-on-surface-variant/50 outline-none w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            {filtered.map(launch => (
              <motion.div key={launch.id} variants={itemVariants} className="glass-card p-8 rounded-[2rem] border-white/5 hover:border-neon-red/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-neon-red/10 flex flex-col justify-between bg-[#0a0a0a]/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-red/5 rounded-full blur-[50px] group-hover:bg-neon-red/10 transition-colors pointer-events-none"></div>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl border border-white/5">
                        {launch.symbol?.[0] || '•'}
                      </div>
                      <div>
                        <h3 className="font-display-lg text-xl text-white font-bold">{launch.name}</h3>
                        <p className="font-label-mono text-[10px] text-on-surface-variant mt-1">LAUNCHED {launch.launch_at ? new Date(launch.launch_at).toLocaleDateString() : launch.date}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">ATH MULTIPLIER</p>
                      <p className="text-primary font-bold text-lg">{launch.ath || 'Hidden'}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">CURRENT PERF.</p>
                      <p className={`font-bold text-lg ${(launch.performance || '').startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                        {launch.performance || 'Archived'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">Current MC</span>
                      <span className="text-white font-bold">{launch.currentMc || launch.market_cap || 'Hidden'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">Liquidity</span>
                      <span className="text-white font-bold">{launch.liquidity || 'Hidden'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">Holders</span>
                      <span className="text-white font-bold">{launch.holders || launch.holder_count || 'Hidden'}</span>
                    </div>
                  </div>
                </div>
                
                <Link to={`/dashboard/user/launch/${launch.id}`} className="w-full flex justify-center items-center gap-2 bg-white/5 hover:bg-white/10 text-on-surface py-3 rounded-xl font-label-mono text-xs transition-colors border border-white/10 hover:border-white/30 mt-6 group-hover:border-neon-red/30 relative z-10">
                  View Post-Launch Report <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="text-center py-24 glass-card rounded-3xl border-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px]"></div>
              <span className="material-symbols-outlined text-6xl mb-4 text-white/20 relative z-10 group-hover:-rotate-12 transition-transform duration-500">history_toggle_off</span>
              <h3 className="text-2xl font-bold text-white mb-2 relative z-10">The Vault is Empty</h3>
              <p className="text-on-surface-variant relative z-10 max-w-sm mx-auto">Our archives are currently empty. Check back after our first official wave of launches!</p>
            </motion.div>
          )}
        </>
      )}

    </PageTransition>
  );
}
