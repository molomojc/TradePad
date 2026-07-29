import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { supabase } from '../../lib/supabase';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [coursesList, setCoursesList] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          
          // Load progress
          const { data: progress } = await supabase
            .from('course_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', id)
            .maybeSingle();

          if (active) setCompleted(progress?.completed || false);
        }

        // Load course details
        const { data: courseData, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (active) setCourse(courseData);

        // Load other courses for list sidebar
        const { data: otherCourses } = await supabase
          .from('courses')
          .select('id, title, duration, access_tier')
          .order('created_at', { ascending: true });

        if (active) setCoursesList(otherCourses ?? []);
      } catch (err) {
        console.error('Error fetching course detail:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      active = false;
    };
  }, [id]);

  const toggleCompleted = async () => {
    if (!supabase || !userId || !id || updatingProgress) return;

    try {
      setUpdatingProgress(true);
      const nextState = !completed;

      const { error } = await supabase
        .from('course_progress')
        .upsert({
          user_id: userId,
          course_id: id,
          completed: nextState,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,course_id' });

      if (error) throw error;
      setCompleted(nextState);
    } catch (err) {
      console.error('Error updating progress:', err);
      alert('Unable to save progress: ' + err.message);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const getEmbedVideoUrl = (url) => {
    if (!url) return '';
    // Google Drive share links conversion to preview embed URL
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([^/]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    // YouTube links conversion
    if (url.includes('youtube.com/watch')) {
      const match = url.match(/v=([^&]+)/);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    if (url.includes('youtu.be/')) {
      const match = url.split('youtu.be/')[1]?.split('?')[0];
      if (match) {
        return `https://www.youtube.com/embed/${match}`;
      }
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <PageTransition className="max-w-3xl mx-auto py-12 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface/20 mb-4">error</span>
        <h3 className="text-xl text-on-surface font-bold mb-2">Lecture Not Found</h3>
        <p className="text-on-surface-variant mb-6 text-sm">The course you are looking for might have been removed or updated.</p>
        <Link to="/dashboard/user/courses" className="secondary-button text-xs">Back to Academy</Link>
      </PageTransition>
    );
  }

  const isIframeVideo = course.video_url?.includes('drive.google.com') || 
                        course.video_url?.includes('youtube.com') || 
                        course.video_url?.includes('youtu.be');

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Back link */}
      <Link to="/dashboard/user/courses" className="inline-flex items-center text-xs font-mono text-on-surface-variant hover:text-on-surface transition-colors gap-1.5">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Academy Directory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1.75fr_0.85fr] gap-8">
        
        {/* Left Column: Player & Overview */}
        <div className="space-y-6">
          {/* Stunning Video Player Wrapper */}
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-outline-variant bg-[#060607] relative shadow-2xl">
            {course.video_url ? (
              isIframeVideo ? (
                <iframe 
                  title={course.title}
                  src={getEmbedVideoUrl(course.video_url)} 
                  className="w-full h-full border-none" 
                  allow="autoplay; encrypted-media; fullscreen" 
                  allowFullScreen 
                />
              ) : (
                <video 
                  src={course.video_url} 
                  controls 
                  className="w-full h-full object-contain"
                  poster={course.thumbnail_url}
                />
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <span className="material-symbols-outlined text-5xl text-on-surface/20 mb-4">play_circle</span>
                <p className="text-on-surface font-bold">No video stream linked for this course</p>
              </div>
            )}
          </div>

          {/* Details details */}
          <div className="glass-card p-6 md:p-8 rounded-3xl border-outline-variant space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-outline-variant pb-6">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded font-mono text-[10px] uppercase">{course.duration}</span>
                  <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded font-mono text-[10px] uppercase">Solana</span>
                  {course.access_tier === 'premium' && (
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold">Premium</span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-on-surface leading-tight">{course.title}</h1>
                <p className="text-xs text-on-surface-variant mt-2 font-mono">Instructor: {course.instructor}</p>
              </div>

              {/* Progress Switch */}
              <button 
                onClick={toggleCompleted}
                disabled={updatingProgress}
                className={`px-5 py-2.5 rounded-xl font-mono font-bold text-xs flex items-center gap-2 border transition-all shrink-0 ${
                  completed 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-surface-variant border-outline-variant text-on-surface hover:bg-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {completed ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                {completed ? 'Completed ✓' : 'Mark Completed'}
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-on-surface font-display">Course Description</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed max-w-3xl">{course.description}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Other Lectures Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-6 rounded-2xl border-outline-variant space-y-4">
            <h3 className="font-display font-bold text-on-surface text-sm uppercase tracking-wider border-b border-outline-variant pb-3">Lessons Directory</h3>
            <nav className="flex flex-col gap-2">
              {coursesList.map((item) => {
                const isActive = item.id === id;
                return (
                  <Link
                    key={item.id}
                    to={`/dashboard/user/courses/${item.id}`}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                      isActive 
                        ? 'bg-primary/10 border-primary/20 text-primary font-bold shadow-inner' 
                        : 'border-transparent hover:bg-surface-variant hover:text-on-surface text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[19px] mt-0.5 shrink-0">
                      {isActive ? 'play_circle' : 'school'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug line-clamp-2">{item.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-on-surface-variant uppercase">
                        <span>{item.duration}</span>
                        <span>•</span>
                        <span className={item.access_tier === 'premium' ? 'text-amber-400 font-bold' : ''}>
                          {item.access_tier}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
