import React, { useState, useEffect } from 'react';
import PageTransition from '../../components/PageTransition';
import Panel from '../../components/Panel';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase, hasSupabaseConfig } from '../../lib/supabase';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const CATEGORY_STYLES = {
  premium: 'bg-primary/15 text-primary',
  launch: 'bg-green-400/15 text-green-400',
  platform: 'bg-blue-400/15 text-blue-400',
};

function categoryClass(category) {
  return CATEGORY_STYLES[(category || '').toLowerCase()] || 'bg-surface-variant text-on-surface-variant';
}

function excerpt(post) {
  if (post.summary) return post.summary;
  if (!post.body) return '';
  return post.body.length > 160 ? `${post.body.slice(0, 160).trim()}…` : post.body;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function News() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);

      if (!hasSupabaseConfig || !supabase) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('news_posts')
        .select('*')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching news:', fetchError);
        setError(fetchError.message);
        setPosts([]);
      } else {
        setPosts(data || []);
      }

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
      <div className="flex justify-between items-end mb-8 relative z-10">
        <div>
          <h1 className="text-4xl font-headline-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-red to-primary tracking-tight mb-2">News & Updates</h1>
          <p className="text-on-surface-variant text-sm">Stay informed with the latest market trends and platform announcements.</p>
        </div>
      </div>

      {error && (
        <Panel className="p-5 border-red-400/20">
          <p className="text-red-400 text-sm">Couldn't load news right now: {error}</p>
        </Panel>
      )}

      {!error && posts.length > 0 && (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
          {posts.map((post) => {
            const CardTag = post.slug ? Link : 'div';
            const cardProps = post.slug ? { to: `/dashboard/user/news/${post.slug}` } : {};
            return (
              <motion.div key={post.id} variants={itemVariants}>
                <Panel
                  as={CardTag}
                  {...cardProps}
                  accent={post.featured ? 'neon-red' : 'primary'}
                  className={`p-8 rounded-[2rem] block cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-neon-red/10 bg-surface border border-outline-variant hover:border-neon-red/30 group relative overflow-hidden ${post.featured ? 'border-neon-red/20' : ''}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neon-red/5 rounded-full blur-[50px] group-hover:bg-neon-red/10 transition-colors pointer-events-none"></div>
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    {post.featured && (
                      <span className="text-[10px] font-label-mono uppercase px-3 py-1 rounded-full bg-neon-red/15 text-neon-red tracking-wider border border-neon-red/20">
                        Featured
                      </span>
                    )}
                    <span className={`text-[10px] font-label-mono uppercase px-2 py-0.5 rounded tracking-wide ${categoryClass(post.category)}`}>
                      {post.category || 'platform'}
                    </span>
                  </div>

                  <h3 className="text-2xl text-on-surface font-headline-md font-bold group-hover:text-neon-red transition-colors relative z-10">
                    {post.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm mt-3 leading-relaxed relative z-10">{excerpt(post)}</p>

                  <div className="flex items-center gap-2 mt-4 text-[11px] font-label-mono text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {formatDate(post.published_at)}
                  </div>
                </Panel>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {!error && posts.length === 0 && (
        <Panel className="p-6">
          <div className="text-center py-24 relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors"></div>
            <span className="material-symbols-outlined text-5xl text-on-surface/20 mb-4 animate-pulse relative z-10 block">podcasts</span>
            <h3 className="text-xl text-on-surface font-bold mb-2 relative z-10">Quiet on the Radar</h3>
            <p className="text-on-surface-variant text-sm relative z-10">Our scouts are out looking for the latest alpha. Check back soon!</p>
          </div>
        </Panel>
      )}
    </PageTransition>
  );
}