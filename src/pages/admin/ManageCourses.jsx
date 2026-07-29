import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, hasSupabaseConfig } from '../../lib/supabase';

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchCourses = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (active) setCourses(data ?? []);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCourses();
    return () => {
      active = false;
    };
  }, []);

  const deleteCourse = async (courseId) => {
    if (!supabase || !window.confirm('Are you sure you want to delete this course?')) return;

    try {
      setSavingId(courseId);
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      setCourses(current => current.filter(c => c.id !== courseId));
      setMessage('Course deleted successfully.');
    } catch (err) {
      console.error('Error deleting course:', err);
      setMessage('Failed to delete course: ' + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const updateCourseTier = async (courseId, accessTier) => {
    if (!supabase) return;

    try {
      setSavingId(courseId);
      const { error } = await supabase
        .from('courses')
        .update({ access_tier: accessTier, updated_at: new Date().toISOString() })
        .eq('id', courseId);

      if (error) throw error;
      setCourses(current => current.map(c => c.id === courseId ? { ...c, access_tier: accessTier } : c));
      setMessage('Access tier updated.');
    } catch (err) {
      console.error('Error updating course:', err);
      setMessage('Failed to update course: ' + err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (!hasSupabaseConfig) {
    return <div className="glass-card p-6 border-white/5 rounded-2xl text-on-surface-variant">Connect Supabase to manage courses.</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-white font-display-lg">Manage Courses</h1>
          <p className="text-on-surface-variant text-sm">Add or edit platform masterclasses, video tutorials, and guides.</p>
        </div>
        <Link to="/dashboard/admin/courses/create" className="bg-primary text-black px-4 py-2 rounded-xl font-mono text-xs font-bold shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:scale-105 transition-transform">
          Create Course
        </Link>
      </div>

      {message && <div className="glass-card p-4 rounded-2xl border-white/5 text-on-surface-variant">{message}</div>}

      {loading ? (
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      ) : (
        <div className="glass-card rounded-3xl border-white/5 overflow-hidden">
          <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-4 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider border-b border-white/5 bg-[#0a0a0a]/30">
            <span>Course details</span>
            <span>Instructor</span>
            <span>Duration</span>
            <span>Tier</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-white/5">
            {courses.map((course) => (
              <div key={course.id} className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center">
                <div className="flex items-center gap-3">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0">
                      M
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-bold truncate">{course.title}</p>
                    <p className="text-on-surface-variant text-xs truncate max-w-[280px]">{course.video_url || 'No Video Linked'}</p>
                  </div>
                </div>
                <p className="text-white text-sm truncate">{course.instructor}</p>
                <p className="text-white text-sm font-mono">{course.duration}</p>
                <select
                  value={course.access_tier}
                  onChange={(event) => updateCourseTier(course.id, event.target.value)}
                  disabled={savingId === course.id}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-primary/50 cursor-pointer w-28"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/dashboard/admin/courses/edit/${course.id}`}
                    className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors text-xs font-mono font-bold"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteCourse(course.id)}
                    disabled={savingId === course.id}
                    className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-mono font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
