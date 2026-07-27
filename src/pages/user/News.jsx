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

export default function News() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const fetchNews = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setPosts([]);
      
      setLoading(false);
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display-lg font-bold text-white mb-2">News & Updates</h1>
          <p className="text-on-surface-variant text-sm">Stay informed with the latest market trends and platform announcements.</p>
        </div>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="glass-card p-6 border-white/5 rounded-3xl"
      >
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <motion.div key={post.id} variants={itemVariants} className="border-b border-white/5 pb-6 last:border-0 last:pb-0 pt-2 group cursor-pointer">
                <span className={`text-[10px] font-label-mono mb-2 inline-block uppercase px-2 py-0.5 rounded ${
                  post.category === 'Premium' ? 'bg-primary/20 text-primary' :
                  post.category === 'Launch' ? 'bg-green-400/20 text-green-400' :
                  post.category === 'Platform' ? 'bg-blue-400/20 text-blue-400' :
                  'bg-white/10 text-on-surface-variant'
                }`}>
                  {post.category}
                </span>
                <h3 className="text-lg text-white font-bold group-hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">{post.summary}</p>
                <div className="flex items-center gap-2 mt-4 text-[11px] font-label-mono text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {post.published_at}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors"></div>
            <span className="material-symbols-outlined text-5xl text-white/20 mb-4 animate-pulse relative z-10">podcasts</span>
            <h3 className="text-xl text-white font-bold mb-2 relative z-10">Quiet on the Radar</h3>
            <p className="text-on-surface-variant text-sm relative z-10">Our scouts are out looking for the latest alpha. Check back soon!</p>
          </div>
        )}
      </motion.div>
    </PageTransition>
  );
}
