import React, { useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function ManagePremium() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    const [subsResponse, cancResponse] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('id, status, started_at, ends_at, profiles(full_name, email), plans(name, slug)')
        .order('created_at', { ascending: false }),
      supabase
        .from('membership_cancellations')
        .select('id, profile_id, reason, status, created_at, profiles(full_name, email)')
        .order('created_at', { ascending: false })
    ]);
    setSubscriptions(subsResponse.data ?? []);
    setCancellations(cancResponse.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveCancellation = async (cancellationId, profileId) => {
    if (!supabase) return;
    try {
      // 1. Approve cancellation
      const { error: cancError } = await supabase
        .from('membership_cancellations')
        .update({ status: 'approved' })
        .eq('id', cancellationId);
      if (cancError) throw cancError;

      // 2. Downgrade profile
      const { error: profError } = await supabase
        .from('profiles')
        .update({ 
          access_tier: 'free', 
          is_premium: false,
          is_founding_member: false 
        })
        .eq('id', profileId);
      if (profError) throw profError;
      
      toast.success('Cancellation approved and membership downgraded.');
      loadData();
    } catch (err) {
      toast.error('Failed to process cancellation.');
      console.error(err);
    }
  };

  if (!hasSupabaseConfig) {
    return <div className="glass-card p-6 border-white/5 rounded-2xl text-on-surface-variant">Connect Supabase to manage premium subscriptions.</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <h1 className="text-2xl text-white font-display-lg">Manage Premium</h1>
      {loading ? (
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      ) : (
        <div className="space-y-8">
          <div className="glass-card rounded-3xl border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Cancellation Requests</h2>
            </div>
            {cancellations.length === 0 ? (
              <div className="p-6 text-on-surface-variant text-sm">No cancellation requests found.</div>
            ) : (
              <>
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-4 text-[11px] font-label-mono text-on-surface-variant uppercase tracking-wider border-b border-white/5 bg-white/5">
                  <span>User</span>
                  <span>Reason</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                <div className="divide-y divide-white/5">
                  {cancellations.map((c) => (
                    <div key={c.id} className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-4 items-center">
                      <span className="text-white font-bold text-sm truncate">{c.profiles?.full_name || c.profiles?.email || 'Unknown user'}</span>
                      <span className="text-on-surface-variant text-sm truncate" title={c.reason}>{c.reason || '-'}</span>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit ${c.status === 'pending' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>{c.status}</span>
                      <div>
                        {c.status === 'pending' && (
                          <button
                            onClick={() => handleApproveCancellation(c.id, c.profile_id)}
                            className="bg-primary text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="glass-card rounded-3xl border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Active Subscriptions</h2>
            </div>
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-4 text-[11px] font-label-mono text-on-surface-variant uppercase tracking-wider border-b border-white/5 bg-white/5">
              <span>User</span>
              <span>Plan</span>
              <span>Status</span>
              <span>Ends</span>
            </div>
            <div className="divide-y divide-white/5">
              {subscriptions.length === 0 ? (
                <div className="p-6 text-on-surface-variant text-sm">No active subscriptions.</div>
              ) : (
                subscriptions.map((subscription) => (
                  <div key={subscription.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center">
                    <span className="text-white font-bold">{subscription.profiles?.full_name || subscription.profiles?.email || 'Unknown user'}</span>
                    <span className="text-white text-sm">{subscription.plans?.name || 'Plan'}</span>
                    <span className="text-white text-sm capitalize">{subscription.status}</span>
                    <span className="text-white text-sm">{subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : 'Active'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
