import React, { useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';

export default function Reports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) return;
      const [launchesRes, newsRes, usersRes] = await Promise.all([
        supabase.from('launches').select('id').eq('status', 'archived'),
        supabase.from('news_posts').select('id').not('published_at', 'is', null),
        supabase.from('profiles').select('id').eq('role', 'admin'),
      ]);

      if (active) {
        setReports([
          { label: 'Archived launches', value: launchesRes.data?.length ?? 0 },
          { label: 'Published news posts', value: newsRes.data?.length ?? 0 },
          { label: 'Admin profiles', value: usersRes.data?.length ?? 0 },
        ]);
      }
    };

    load().catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!hasSupabaseConfig) {
    return <div className="glass-card p-6 border-white/5 rounded-2xl text-on-surface-variant">Connect Supabase to view reports.</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <h1 className="text-2xl text-white font-display-lg">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div key={report.label} className="glass-card p-6 border-white/5 rounded-2xl">
            <p className="text-[11px] uppercase tracking-wider font-label-mono text-on-surface-variant">{report.label}</p>
            <p className="text-white text-3xl font-bold mt-2">{report.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
