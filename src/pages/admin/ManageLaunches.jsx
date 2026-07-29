import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';

export default function ManageLaunches() {
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('launches')
        .select('id, slug, name, status, chain, access_tier, featured, launch_at, teaser_label, joined_count, is_teaser')
        .order('created_at', { ascending: false });
      if (active) setLaunches(data ?? []);
      if (active) setLoading(false);
    };
    load().catch(() => setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const updateLaunch = async (launchId, patch) => {
    if (!supabase) return;
    try {
      setSavingId(launchId);
      setMessage('');
      const { error } = await supabase
        .from('launches')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', launchId);
      if (error) throw error;
      setLaunches((current) => current.map((launch) => (launch.id === launchId ? { ...launch, ...patch } : launch)));
      setMessage('Launch updated.');
    } catch (error) {
      setMessage(error?.message || 'Unable to update launch.');
    } finally {
      setSavingId(null);
    }
  };

  if (!hasSupabaseConfig) {
    return <div className="glass-card p-6 border-white/5 rounded-2xl text-on-surface-variant">Connect Supabase to manage launches.</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-white font-display-lg">Manage Launches</h1>
          <p className="text-on-surface-variant text-sm">Update launch status, visibility, and featured state.</p>
        </div>
        <Link to="/dashboard/admin/launches/create" className="bg-primary text-black px-4 py-2 rounded-xl font-label-mono text-xs font-bold">
          Create Launch
        </Link>
      </div>

      {message && <div className="glass-card p-4 rounded-2xl border-white/5 text-on-surface-variant">{message}</div>}

      {loading ? (
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      ) : (
        <div className="glass-card rounded-3xl border-white/5 overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 text-[11px] font-label-mono text-on-surface-variant uppercase tracking-wider border-b border-white/5">
            <span>Launch</span>
            <span>Status</span>
            <span>Chain</span>
            <span>Tier</span>
            <span>Visibility</span>
            <span>Featured</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-white/5">
            {launches.map((launch) => (
              <div key={launch.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center">
                <div>
                  <p className="text-white font-bold">{launch.name}</p>
                  <p className="text-on-surface-variant text-sm">{launch.slug}</p>
                </div>
                <select
                  value={launch.status}
                  onChange={(event) => updateLaunch(launch.id, { status: event.target.value })}
                  disabled={savingId === launch.id}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
                <p className="text-white text-sm capitalize">{launch.chain}</p>
                <p className="text-white text-sm capitalize">{launch.access_tier}</p>
                <div>
                  <p className="text-white text-sm">{launch.is_teaser ? launch.teaser_label || 'Next Launch' : 'Public launch card'}</p>
                  <p className="text-on-surface-variant text-xs">{launch.joined_count ?? 0} joined</p>
                </div>
                <label className="flex items-center gap-2 text-white text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(launch.featured)}
                    onChange={(event) => updateLaunch(launch.id, { featured: event.target.checked })}
                    disabled={savingId === launch.id}
                  />
                  Featured
                </label>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/dashboard/admin/launches/edit/${launch.id}`}
                    className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors text-xs font-mono font-bold"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => updateLaunch(launch.id, { status: launch.status === 'live' ? 'upcoming' : 'live' })}
                    disabled={savingId === launch.id}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono font-bold"
                  >
                    Toggle Live
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
