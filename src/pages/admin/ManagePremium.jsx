import React, { useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';

export default function ManagePremium() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('subscriptions')
        .select('id, status, started_at, ends_at, profiles(full_name, email), plans(name, slug)')
        .order('created_at', { ascending: false });
      if (active) setSubscriptions(data ?? []);
      if (active) setLoading(false);
    };
    load().catch(() => setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (!hasSupabaseConfig) {
    return <div className="glass-card p-6 border-white/5 rounded-2xl text-on-surface-variant">Connect Supabase to manage premium subscriptions.</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <h1 className="text-2xl text-white font-display-lg">Manage Premium</h1>
      {loading ? (
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      ) : (
        <div className="glass-card rounded-3xl border-white/5 overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-4 text-[11px] font-label-mono text-on-surface-variant uppercase tracking-wider border-b border-white/5">
            <span>User</span>
            <span>Plan</span>
            <span>Status</span>
            <span>Ends</span>
          </div>
          <div className="divide-y divide-white/5">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-4">
                <span className="text-white font-bold">{subscription.profiles?.full_name || subscription.profiles?.email || 'Unknown user'}</span>
                <span className="text-white text-sm">{subscription.plans?.name || 'Plan'}</span>
                <span className="text-white text-sm capitalize">{subscription.status}</span>
                <span className="text-white text-sm">{subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : 'Active'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
