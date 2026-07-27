import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { ensureProfileRow, fetchCurrentUserProfile, hasSupabaseConfig } from '../../lib/supabase';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [statusMessage, setStatusMessage] = useState('Confirming your account status...');

  useEffect(() => {
    const upgradeProfile = async () => {
      if (!hasSupabaseConfig) {
        setStatusMessage('Payment received. Your account will refresh once Supabase is connected.');
        return;
      }

      const { profile, session } = await fetchCurrentUserProfile();
      if (!session?.user) {
        setStatusMessage('Payment received. Sign in again to sync your premium access.');
        return;
      }

      const { error } = await ensureProfileRow(session.user, {
        email: session.user.email,
        full_name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email,
        username: profile?.username || session.user.user_metadata?.username || session.user.email?.split('@')[0],
        access_tier: 'premium',
        is_premium: true,
      });

      if (error) {
        setStatusMessage('Payment received. We could not update the profile row automatically, but the order is recorded.');
        return;
      }

      setStatusMessage('Your profile has been upgraded to premium.');
    };

    upgradeProfile();
  }, []);

  return (
    <PageTransition className="max-w-3xl mx-auto py-20">
      <div className="glass-card rounded-[2rem] p-10 border-white/10 text-center">
        <span className="material-symbols-outlined text-6xl text-primary mb-4">verified</span>
        <h1 className="text-4xl font-display-lg font-bold text-white mb-4">Checkout received</h1>
        <p className="text-on-surface-variant max-w-xl mx-auto mb-8">
          Lemon Squeezy has received your order. Once the webhook confirms payment, your profile will be upgraded to premium.
        </p>
        <p className="text-sm text-white mb-6">{statusMessage}</p>
        {sessionId && (
          <p className="text-[11px] font-label-mono text-on-surface-variant mb-6 break-all">
            Checkout ID: {sessionId}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/dashboard/user" className="inline-flex bg-primary text-black px-6 py-3 rounded-xl font-label-mono font-bold text-sm">
            Go to Dashboard
          </Link>
          <Link to="/dashboard/user/premium" className="inline-flex bg-white/5 text-white px-6 py-3 rounded-xl font-label-mono font-bold text-sm border border-white/10">
            Check Premium Status
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
