import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { motion } from 'framer-motion';
import { supabase, hasSupabaseConfig } from '../../lib/supabase';

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

function formatUsd(val) {
  if (val == null || Number.isNaN(Number(val))) return '$0';
  return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatNumber(val) {
  if (val == null || Number.isNaN(Number(val))) return '0';
  return Number(val).toLocaleString();
}

export default function MyAllocations() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllocations = async () => {
      setLoading(true);
      const list = [];
      try {
        if (hasSupabaseConfig && supabase) {
          // 1. Fetch joined launches from launch_participants
          try {
            const { data: participations, error: pError } = await supabase
              .from('launch_participants')
              .select('*, launches(*)')
              .order('joined_at', { ascending: false });

            if (pError) throw pError;

            if (participations) {
              list.push(...participations.map(item => ({
                id: `participation-${item.id}`,
                name: item.launches?.name || 'Unknown Launch',
                symbol: item.launches?.symbol || 'TOKEN',
                chain: item.launches?.chain || 'solana',
                invested: 0,
                allocatedTokens: 0,
                status: 'Joined Launch',
                progress: 0,
                claimableVal: 0,
                nextClaim: 'Awaiting Launch',
                icon: (item.launches?.symbol || '•').slice(0, 2).toUpperCase()
              })));
            }
          } catch (e) {
            console.error('Error fetching launch participations:', e);
          }

          // 2. Fetch completed allocations from user_allocations
          try {
            const { data: userAllocs, error: uError } = await supabase
              .from('user_allocations')
              .select('*, launches(*)')
              .order('created_at', { ascending: false });

            if (uError) throw uError;

            if (userAllocs) {
              list.push(...userAllocs.map(item => {
                const claimed = Number(item.tokens_claimed || 0);
                const allocated = Number(item.tokens_allocated || 1);
                const progress = Math.min(Math.round((claimed / allocated) * 100), 100);
                const invested = Number(item.amount_invested_usd || 0);
                const claimableVal = progress >= 100 ? 0 : invested * 2.1;

                return {
                  id: `allocation-${item.id}`,
                  name: item.launches?.name || 'Unknown Launch',
                  symbol: item.launches?.symbol || 'TOKEN',
                  chain: item.launches?.chain || 'solana',
                  invested,
                  allocatedTokens: item.tokens_allocated,
                  status: claimed >= allocated ? 'Claimed' : (progress > 0 ? 'Vesting' : 'Claimable'),
                  progress,
                  claimableVal,
                  nextClaim: progress >= 100 ? 'Fully Vested' : 'Immediate',
                  icon: (item.launches?.symbol || '•').slice(0, 2).toUpperCase()
                };
              }));
            }
          } catch (e) {
            console.log('user_allocations table not configured or missing, skipping');
          }

          setAllocations(list);
        } else {
          setAllocations([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllocations();
  }, []);

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-red to-primary tracking-tight mb-2">My Allocations</h1>
          <p className="text-on-surface-variant text-sm">Track your investments, token allocations, and vesting schedules.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Allocations List */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {allocations.map(item => (
              <motion.div key={item.id} variants={itemVariants} className="glass-card p-8 rounded-[2rem] border-white/5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-primary/10 bg-[#0a0a0a]/40 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
                  
                  {/* Project Info */}
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-lg border border-white/5 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-white font-bold">{item.name}</h3>
                      <span className="bg-white/5 text-on-surface-variant px-2 py-0.5 rounded font-mono text-[10px] uppercase">{item.chain}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-auto md:flex-1 md:justify-end">
                    <div>
                      <p className="font-mono text-[10px] text-on-surface-variant mb-1">INVESTED</p>
                      <p className="text-white font-bold">{formatUsd(item.invested)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-on-surface-variant mb-1">ALLOCATION</p>
                      <p className="text-white font-bold text-sm">{formatNumber(item.allocatedTokens)} {item.symbol}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="font-mono text-[10px] text-on-surface-variant mb-1">STATUS</p>
                      <span className={`px-2 py-1 rounded font-mono text-[10px] font-bold ${
                        item.status === 'Claimable' ? 'bg-green-400/20 text-green-400' :
                        item.status === 'Vesting' ? 'bg-blue-400/20 text-blue-400' :
                        item.status === 'Joined Launch' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-on-surface-variant'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="font-mono text-[10px] text-on-surface-variant mb-1">NEXT CLAIM</p>
                      <p className={`font-bold text-sm ${item.status === 'Claimable' ? 'text-primary' : 'text-white'}`}>{item.nextClaim}</p>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="w-full md:w-auto shrink-0">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={item.status !== 'Claimable'}
                      className={`w-full md:w-32 py-3 rounded-xl font-mono font-bold text-xs transition-all ${
                        item.status === 'Claimable' 
                          ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,46,46,0.2)] hover:shadow-[0_0_25px_rgba(255,46,46,0.5)]' 
                          : 'bg-white/5 text-on-surface-variant cursor-not-allowed border border-white/5'
                      }`}
                    >
                      {item.status === 'Joined Launch' ? 'Awaiting Pool' : (item.status === 'Claimable' ? 'Claim Tokens' : 'Locked')}
                    </motion.button>
                  </div>

                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-4 border-t border-white/5">
                  <div className="flex justify-between font-mono text-[10px] text-on-surface-variant mb-2">
                    <span>Vesting Progress</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>

              </motion.div>
            ))}
          </motion.div>

          {allocations.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 border-white/5 rounded-3xl text-center relative overflow-hidden group">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-colors"></div>
              <span className="material-symbols-outlined text-6xl text-primary/50 mb-4 block relative z-10 animate-bounce">rocket_launch</span>
              <h3 className="text-3xl font-display font-bold text-white mb-2 relative z-10">Your Portfolio is Empty</h3>
              <p className="text-on-surface-variant max-w-sm mx-auto mb-6 relative z-10">
                You haven't participated in any launches yet. Explore upcoming projects and secure your first allocation!
              </p>
              <Link to="/dashboard/user/upcoming" className="inline-block bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-mono text-sm transition-colors border border-white/10 relative z-10">
                Explore Launches
              </Link>
            </motion.div>
          )}
        </>
      )}

    </PageTransition>
  );
}
