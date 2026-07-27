import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ensureProfileRow,
  fetchCurrentUserProfile,
  signInWithOAuth,
  signInWithPassword,
  signUpWithPassword,
} from '../lib/supabase';

export default function AuthModal() {
  const navigate = useNavigate();
  const { isOpen, view, closeAuthModal, switchView } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [oauthProvider, setOauthProvider] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (view === 'login') {
        const { error: signInError } = await signInWithPassword(email, password);
        if (signInError) throw signInError;
        const { profile } = await fetchCurrentUserProfile();
        navigate(profile?.role === 'admin' ? '/dashboard/admin' : '/dashboard/user', { replace: true });
      } else {
        const { data, error: signUpError } = await signUpWithPassword(email, password);
        if (signUpError) throw signUpError;

        const user = data?.user || data?.session?.user;
        if (user) {
          await ensureProfileRow(user, {
            email,
            full_name: email?.split('@')[0] || email,
            username: email?.split('@')[0] || email,
          });
        }

        navigate('/dashboard/user', { replace: true });
      }

      closeAuthModal();
      setEmail('');
      setPassword('');
    } catch (submitError) {
      setError(submitError?.message || 'Unable to authenticate right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider) => {
    setOauthProvider(provider);
    setError('');

    try {
      const { error: oauthError } = await signInWithOAuth(provider);
      if (oauthError) throw oauthError;
    } catch (oauthSubmitError) {
      setError(oauthSubmitError?.message || `Unable to continue with ${provider}.`);
      setOauthProvider('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={closeAuthModal}
          />
          
          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="glass-card rounded-[2rem] w-full max-w-md p-8 border-white/10 relative z-10 shadow-2xl overflow-hidden"
          >
            {/* Animated Background Glow */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>

            <button 
              onClick={closeAuthModal}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-white transition-colors z-20"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, x: view === 'login' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: view === 'login' ? 20 : -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-8 relative z-10">
                  <h2 className="font-display-lg text-3xl font-bold text-white mb-2">
                    {view === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className="text-on-surface-variant text-sm">
                    {view === 'login' 
                      ? 'Log in to access your dashboard and premium features.' 
                      : 'Join the next generation of premium launches.'}
                  </p>
                </div>

                <form className="space-y-4 relative z-10" onSubmit={handleSubmit}>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleOAuth('google')}
                      disabled={submitting || oauthProvider}
                      className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[18px] text-red-400">g_mobiledata</span>
                      Continue with Google
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuth('apple')}
                      disabled={submitting || oauthProvider}
                      className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[18px]">apple</span>
                      Continue with Apple
                    </button>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider">or</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div>
                    <label className="font-label-mono text-[11px] text-on-surface-variant block mb-1.5 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-white/20" 
                      placeholder="you@example.com" 
                    />
                  </div>

                  <div>
                    <label className="font-label-mono text-[11px] text-on-surface-variant block mb-1.5 uppercase tracking-wider">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-white/20" 
                      placeholder="••••••••" 
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  )}

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={submitting || oauthProvider}
                    className="w-full bg-primary text-black py-3.5 rounded-xl font-label-mono font-bold text-sm shadow-[0_0_20px_rgba(198,198,198,0.2)] hover:shadow-[0_0_30px_rgba(198,198,198,0.4)] transition-shadow mt-4 disabled:opacity-60"
                  >
                    {submitting ? 'Please wait...' : oauthProvider ? `Opening ${oauthProvider}...` : view === 'login' ? 'Sign In' : 'Create Account'}
                  </motion.button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center relative z-10">
                  <p className="text-sm text-on-surface-variant">
                    {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <button 
                      onClick={() => switchView(view === 'login' ? 'signup' : 'login')}
                      className="text-primary font-bold hover:underline font-label-mono ml-1"
                    >
                      {view === 'login' ? 'Sign Up' : 'Log In'}
                    </button>
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
