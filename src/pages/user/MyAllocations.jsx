import React, { useState, useEffect } from 'react';
import PageTransition from '../../components/PageTransition';
import { motion } from 'framer-motion';

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

export default function MyAllocations() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const fetchAllocations = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      setAllocations([]);
      setLoading(false);
    };

    fetchAllocations();
  }, []);

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display-lg font-bold text-white mb-2">My Allocations</h1>
          <p className="text-on-surface-variant text-sm">Track your investments, token allocations, and vesting schedules.</p>
        </div>
        <div className="glass-card px-6 py-3 rounded-2xl border-primary/20 flex gap-6 items-center">
          <div>
            <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">TOTAL INVESTED</p>
            <p className="font-display-lg font-bold text-white text-xl">$1,950</p>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div>
            <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">CLAIMABLE VALUE</p>
            <p className="font-display-lg font-bold text-primary text-xl">$4,230</p>
          </div>
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
              <motion.div key={item.id} variants={itemVariants} className="glass-card p-6 rounded-3xl border-white/5 hover:border-white/10 transition-colors">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                  
                  {/* Project Info */}
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-lg border border-white/5 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-display-lg text-lg text-white font-bold">{item.name}</h3>
                      <span className="bg-white/5 text-on-surface-variant px-2 py-0.5 rounded font-label-mono text-[10px]">{item.chain}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-auto md:flex-1 md:justify-end">
                    <div>
                      <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">INVESTED</p>
                      <p className="text-white font-bold">{item.invested}</p>
                    </div>
                    <div>
                      <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">ALLOCATION</p>
                      <p className="text-white font-bold text-sm">{item.allocatedTokens}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">STATUS</p>
                      <span className={`px-2 py-1 rounded font-label-mono text-[10px] font-bold ${
                        item.status === 'Claimable' ? 'bg-green-400/20 text-green-400' :
                        item.status === 'Vesting' ? 'bg-blue-400/20 text-blue-400' : 'bg-white/10 text-on-surface-variant'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">NEXT CLAIM</p>
                      <p className={`font-bold text-sm ${item.status === 'Claimable' ? 'text-primary' : 'text-white'}`}>{item.nextClaim}</p>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="w-full md:w-auto shrink-0">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={item.status !== 'Claimable'}
                      className={`w-full md:w-32 py-2.5 rounded-xl font-label-mono font-bold text-xs transition-all ${
                        item.status === 'Claimable' 
                          ? 'bg-primary text-black shadow-[0_0_15px_rgba(198,198,198,0.2)]' 
                          : 'bg-white/5 text-on-surface-variant cursor-not-allowed'
                      }`}
                    >
                      {item.status === 'Claimable' ? 'Claim Tokens' : 'Locked'}
                    </motion.button>
                  </div>

                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-4 border-t border-white/5">
                  <div className="flex justify-between font-label-mono text-[10px] text-on-surface-variant mb-2">
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
              <h3 className="text-2xl font-display-lg font-bold text-white mb-2 relative z-10">Your Portfolio is Empty</h3>
              <p className="text-on-surface-variant max-w-sm mx-auto mb-6 relative z-10">
                You haven't participated in any launches yet. Explore upcoming projects and secure your first allocation!
              </p>
              <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-label-mono text-sm transition-colors border border-white/10 relative z-10">
                Explore Launches
              </button>
            </motion.div>
          )}
        </>
      )}

    </PageTransition>
  );
}
