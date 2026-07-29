import React, { useEffect, useState } from 'react';
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

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      if (!supabase) return;
      try {
        setLoading(true);

        // Fetch user profile to check premium access
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          if (active) setUserProfile(profile);

          // Fetch user progress
          const { data: progress } = await supabase
            .from('course_progress')
            .select('*')
            .eq('user_id', user.id);

          if (progress && active) {
            const map = {};
            progress.forEach(p => {
              map[p.course_id] = p.completed;
            });
            setProgressMap(map);
          }
        }

        // Fetch courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: true });

        if (active) setCourses(coursesData ?? []);
      } catch (err) {
        console.error('Error loading courses:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const isPremiumUser = userProfile?.access_tier === 'premium' || userProfile?.is_premium;

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Hero Header */}
      <div className="relative rounded-3xl border border-white/5 bg-[#0a0a0a]/60 p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono font-bold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> TradePad Academy
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
            Master the Memecoin Markets
          </h1>
          <p className="text-on-surface-variant text-base leading-relaxed">
            Boost your trading edge with institutional-grade video masterclasses covering Solana liquidity setups, smart wallet tracking, and whitelisting blueprints.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4"
        >
          {courses.map((course) => {
            const isPremiumCourse = course.access_tier === 'premium';
            const isLocked = isPremiumCourse && !isPremiumUser;
            const isCompleted = progressMap[course.id] === true;

            return (
              <motion.div
                key={course.id}
                variants={itemVariants}
                className="glass-card flex flex-col justify-between overflow-hidden rounded-2xl border-white/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-primary/5 bg-[#0a0a0a]/40 group"
              >
                {/* Card Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/40 border-b border-white/5">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                      <span className="material-symbols-outlined text-4xl text-white/25">school</span>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                    {isPremiumCourse ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider shadow-md">
                        <span className="material-symbols-outlined text-[12px]">workspace_premium</span> Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-white/10 bg-white/10 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                        Free
                      </span>
                    )}

                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span> Completed
                      </span>
                    )}
                  </div>

                  {/* Lock Screen overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px] flex flex-col items-center justify-center text-center p-4">
                      <span className="material-symbols-outlined text-3xl text-amber-400 mb-2">lock</span>
                      <p className="text-white text-xs font-mono font-bold uppercase tracking-wider">Premium Access Required</p>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
                      <span>{course.duration || 'TBA'}</span>
                      <span className="truncate max-w-[120px]">{course.instructor || 'Academy'}</span>
                    </div>
                    <h3 className="font-display text-lg text-white font-bold group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{course.description}</p>
                  </div>

                  {isLocked ? (
                    <Link
                      to="/dashboard/user/premium"
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-center font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    >
                      Unlock Academy <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </Link>
                  ) : (
                    <Link
                      to={`/dashboard/user/courses/${course.id}`}
                      className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-center font-mono font-bold text-xs transition-all flex items-center justify-center gap-1 group-hover:border-primary/30 group-hover:bg-primary/5"
                    >
                      {isCompleted ? 'Watch Again' : 'Start Course'} <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">play_arrow</span>
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </PageTransition>
  );
}
