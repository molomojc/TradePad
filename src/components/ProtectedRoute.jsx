import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchCurrentUserProfile, hasSupabaseConfig } from '../lib/supabase';

function AccessGate({ title, message }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="glass-card rounded-3xl border-white/5 p-8 max-w-lg w-full text-center">
        <h1 className="text-2xl font-display-lg text-white font-bold mb-3">{title}</h1>
        <p className="text-on-surface-variant">{message}</p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ requireRole, children }) {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, allowed: false, role: null });

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      if (!hasSupabaseConfig) {
        if (active) setState({ loading: false, allowed: false, role: null });
        return;
      }

      const { profile, session } = await fetchCurrentUserProfile();
      const role = profile?.role || (session?.user ? 'user' : null);
      const allowed =
        Boolean(session?.user) &&
        (!requireRole || role === requireRole || role === 'admin');

      if (active) setState({ loading: false, allowed, role });
    };

    checkAccess().catch(() => {
      if (active) setState({ loading: false, allowed: false, role: null });
    });

    return () => {
      active = false;
    };
  }, [requireRole]);

  if (state.loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <AccessGate
        title="Supabase is not configured"
        message="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable protected dashboard access."
      />
    );
  }

  if (!state.allowed) {
    const redirectTo = (state.role && requireRole === 'admin') ? '/dashboard/user' : '/';
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          from: location.pathname,
          accessDenied: true,
          reason: requireRole === 'admin' ? 'admin-only' : 'auth-required',
        }}
      />
    );
  }

  return children;
}
