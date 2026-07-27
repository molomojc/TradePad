import React, { useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    monthly_mrr: '',
    total_volume: '',
    active_launches: '',
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('platform_metrics')
        .select('monthly_mrr, total_volume, active_launches')
        .order('metric_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && active) {
        setSettings({
          monthly_mrr: data.monthly_mrr ?? '',
          total_volume: data.total_volume ?? '',
          active_launches: data.active_launches ?? '',
        });
      }
    };
    load().catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const save = async (event) => {
    event.preventDefault();
    if (!supabase) return;
    try {
      setSaving(true);
      setMessage('');
      const { error } = await supabase.from('platform_metrics').upsert({
        metric_date: new Date().toISOString().slice(0, 10),
        monthly_mrr: Number(settings.monthly_mrr || 0),
        total_volume: Number(settings.total_volume || 0),
        active_launches: Number(settings.active_launches || 0),
      });
      if (error) throw error;
      setMessage('Platform metrics saved.');
    } catch (error) {
      setMessage(error?.message || 'Unable to save.');
    } finally {
      setSaving(false);
    }
  };

  if (!hasSupabaseConfig) {
    return <div className="glass-card p-6 border-white/5 rounded-2xl text-on-surface-variant">Connect Supabase to edit admin settings.</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <h1 className="text-2xl text-white font-display-lg mb-6">Admin Settings</h1>
      <form onSubmit={save} className="glass-card p-6 border-white/5 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-label-mono text-on-surface-variant">Monthly MRR</span>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={settings.monthly_mrr} onChange={(e) => setSettings((c) => ({ ...c, monthly_mrr: e.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-label-mono text-on-surface-variant">Total Volume</span>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={settings.total_volume} onChange={(e) => setSettings((c) => ({ ...c, total_volume: e.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-label-mono text-on-surface-variant">Active Launches</span>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={settings.active_launches} onChange={(e) => setSettings((c) => ({ ...c, active_launches: e.target.value }))} />
          </label>
        </div>
        {message && <p className="text-sm text-on-surface-variant">{message}</p>}
        <button disabled={saving} className="bg-primary text-black px-5 py-3 rounded-xl font-label-mono text-sm font-bold disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Platform Metrics'}
        </button>
      </form>
    </div>
  );
}
