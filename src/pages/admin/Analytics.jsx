import React, { useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';

export default function Analytics() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('platform_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && active) setMetrics(data);
    };
    load().catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!hasSupabaseConfig) {
    return <div className="glass-card p-6 border-white/5 rounded-2xl text-on-surface-variant">Connect Supabase to load analytics.</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
      <h1 className="text-2xl text-white font-display-lg mb-6">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          ['Free users', metrics?.free_users],
          ['Premium users', metrics?.premium_users],
          ['Archived launches', metrics?.archived_launches],
          ['Active launches', metrics?.active_launches],
          ['Monthly MRR', metrics?.monthly_mrr],
          ['Total volume', metrics?.total_volume],
        ].map(([label, value]) => (
          <div key={label} className="glass-card p-6 border-white/5 rounded-2xl">
            <p className="text-[11px] uppercase tracking-wider font-label-mono text-on-surface-variant">{label}</p>
            <p className="text-white text-2xl font-bold mt-2">{value ?? '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
