import React, { useState, useEffect } from 'react';
import PageTransition from '../../components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: 'person' },
  { id: 'preferences', label: 'Preferences', icon: 'tune' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  { id: 'security', label: 'Security', icon: 'shield_lock' },
];

const CHAINS = [
  { id: 'solana', label: 'Solana' },
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'base', label: 'Base' },
  { id: 'bsc', label: 'BSC' },
  { id: 'polygon', label: 'Polygon' },
];

const NOTIFICATION_ROWS = [
  { key: 'email_notifications', label: 'Email notifications', desc: 'Account activity and security alerts.' },
  { key: 'launch_alerts', label: 'Launch alerts', desc: 'Get notified the moment a new listing is detected.' },
  { key: 'premium_digest', label: 'Premium research digest', desc: 'Weekly summary of conviction scores and top picks.' },
  { key: 'marketing_emails', label: 'Marketing emails', desc: 'Occasional product updates and offers.' },
];

const TAKEN_USERNAMES = ['admin', 'root', 'support', 'tradepad'];

const SESSIONS = [
  { device: 'MacBook Pro · Chrome', location: 'Johannesburg, ZA', lastActive: 'Active now', current: true },
  { device: 'iPhone 15 · Safari', location: 'Cape Town, ZA', lastActive: '2 days ago', current: false },
];

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200 ${
        checked ? 'bg-primary' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="space-y-2 block">
      <span className="text-[11px] uppercase tracking-wider font-label-mono text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors';

export default function Settings() {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | available | taken

  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      const initial = {
        full_name: 'Jacob Developer',
        username: 'jacobdev',
        bio: 'Crypto enthusiast and web3 builder.',
        favorite_chain: 'solana',
        compact_mode: false,
        email_notifications: true,
        launch_alerts: true,
        premium_digest: false,
        marketing_emails: false,
        two_factor_enabled: false,
      };
      setSaved(initial);
      setDraft(initial);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!draft || !saved) return;
    if (draft.username === saved.username) {
      setUsernameStatus('idle');
      return;
    }
    if (!draft.username.trim()) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const timeout = setTimeout(() => {
      const taken = TAKEN_USERNAMES.includes(draft.username.trim().toLowerCase());
      setUsernameStatus(taken ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(timeout);
  }, [draft?.username, saved]);

  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const hasChanges = saved && draft && JSON.stringify(saved) !== JSON.stringify(draft);
  const canSave = hasChanges && usernameStatus !== 'taken' && usernameStatus !== 'checking';

  const discardChanges = () => setDraft(saved);

  const saveSettings = async () => {
    if (!canSave) return;
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSaved(draft);
    setSaving(false);
    setToast('Settings saved.');
    setTimeout(() => setToast(''), 2500);
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    if (passwordForm.next.length < 8) {
      setPasswordMessage('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage('New password and confirmation do not match.');
      return;
    }
    setPasswordSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setPasswordSaving(false);
    setPasswordForm({ current: '', next: '', confirm: '' });
    setPasswordMessage('Password updated.');
  };

  if (loading || !draft) {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="max-w-5xl mx-auto pb-28">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display-lg font-bold text-white mb-2">Settings</h1>
          <p className="text-on-surface-variant text-sm">Update your preferences and platform configuration.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">

        {/* Section nav */}
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-label-mono whitespace-nowrap transition-all shrink-0 ${
                activeSection === section.id
                  ? 'bg-primary/10 border border-primary/30 text-primary'
                  : 'border border-transparent text-on-surface-variant hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        {/* Section content */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === 'profile' && (
                <div className="glass-card p-8 border-white/5 rounded-3xl space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Full name">
                      <input
                        className={inputClass}
                        value={draft.full_name}
                        onChange={(e) => update('full_name', e.target.value)}
                      />
                    </Field>
                    <Field label="Username">
                      <div className="relative">
                        <input
                          className={`${inputClass} pr-10`}
                          value={draft.username}
                          onChange={(e) => update('username', e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                          {usernameStatus === 'checking' && (
                            <span className="w-4 h-4 border-2 border-white/20 border-t-primary rounded-full animate-spin block" />
                          )}
                          {usernameStatus === 'available' && (
                            <span className="material-symbols-outlined text-[18px] text-green-400">check_circle</span>
                          )}
                          {usernameStatus === 'taken' && (
                            <span className="material-symbols-outlined text-[18px] text-red-400">cancel</span>
                          )}
                        </span>
                      </div>
                      {usernameStatus === 'taken' && (
                        <p className="text-red-400 text-[12px]">That username is already taken.</p>
                      )}
                      {usernameStatus === 'available' && (
                        <p className="text-green-400 text-[12px]">Username is available.</p>
                      )}
                    </Field>
                  </div>

                  <Field label={`Bio (${draft.bio.length}/160)`}>
                    <textarea
                      className={`${inputClass} min-h-[120px] resize-none`}
                      maxLength={160}
                      value={draft.bio}
                      onChange={(e) => update('bio', e.target.value)}
                    />
                  </Field>
                </div>
              )}

              {activeSection === 'preferences' && (
                <div className="glass-card p-8 border-white/5 rounded-3xl space-y-8">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-label-mono text-on-surface-variant mb-3">
                      Favorite chain
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CHAINS.map((chain) => {
                        const active = draft.favorite_chain === chain.id;
                        return (
                          <button
                            key={chain.id}
                            onClick={() => update('favorite_chain', chain.id)}
                            className={`px-4 py-2 rounded-full text-[12px] font-label-mono border transition-all ${
                              active
                                ? 'bg-primary/10 border-primary/40 text-primary'
                                : 'bg-white/5 border-white/10 text-on-surface-variant hover:border-primary/30'
                            }`}
                          >
                            {chain.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div>
                      <p className="text-white text-sm font-bold">Compact mode</p>
                      <p className="text-on-surface-variant text-[12px] mt-0.5">Show denser tables with smaller row heights.</p>
                    </div>
                    <ToggleSwitch checked={draft.compact_mode} onChange={(v) => update('compact_mode', v)} />
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="glass-card p-8 border-white/5 rounded-3xl divide-y divide-white/5">
                  {NOTIFICATION_ROWS.map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-white text-sm font-bold">{row.label}</p>
                        <p className="text-on-surface-variant text-[12px] mt-0.5">{row.desc}</p>
                      </div>
                      <ToggleSwitch checked={draft[row.key]} onChange={(v) => update(row.key, v)} />
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-6">
                  <div className="glass-card p-8 border-white/5 rounded-3xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-white text-sm font-bold">Two-factor authentication</p>
                        <p className="text-on-surface-variant text-[12px] mt-0.5">Require a code from your authenticator app at login.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {!draft.two_factor_enabled && (
                          <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-label-mono tracking-wide">
                            RECOMMENDED
                          </span>
                        )}
                        <ToggleSwitch checked={draft.two_factor_enabled} onChange={(v) => update('two_factor_enabled', v)} />
                      </div>
                    </div>

                    <form onSubmit={submitPassword} className="space-y-4 pt-6 border-t border-white/5">
                      <p className="text-white text-sm font-bold">Change password</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="password"
                          placeholder="Current password"
                          className={inputClass}
                          value={passwordForm.current}
                          onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
                        />
                        <input
                          type="password"
                          placeholder="New password"
                          className={inputClass}
                          value={passwordForm.next}
                          onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                        />
                        <input
                          type="password"
                          placeholder="Confirm new password"
                          className={inputClass}
                          value={passwordForm.confirm}
                          onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <p className={`text-[13px] ${passwordMessage.includes('updated') ? 'text-green-400' : 'text-red-400'}`}>
                          {passwordMessage}
                        </p>
                        <button
                          type="submit"
                          disabled={passwordSaving}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all px-5 py-2.5 rounded-full font-label-mono font-bold text-xs text-white disabled:opacity-60"
                        >
                          {passwordSaving ? 'Updating…' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="glass-card p-8 border-white/5 rounded-3xl">
                    <p className="text-white text-sm font-bold mb-1">Active sessions</p>
                    <p className="text-on-surface-variant text-[12px] mb-5">Devices currently signed in to your account.</p>
                    <div className="space-y-3">
                      {SESSIONS.map((session) => (
                        <div
                          key={session.device}
                          className="flex items-center justify-between gap-4 bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                              {session.device.includes('iPhone') ? 'smartphone' : 'laptop_mac'}
                            </span>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-bold truncate">{session.device}</p>
                              <p className="text-on-surface-variant text-[12px]">
                                {session.location} · {session.lastActive}
                              </p>
                            </div>
                          </div>
                          {session.current ? (
                            <span className="text-[11px] font-label-mono text-primary shrink-0">This device</span>
                          ) : (
                            <button
                              onClick={() => alert('Simulating session sign-out...')}
                              className="text-[11px] font-label-mono text-red-400 hover:text-red-300 transition-colors shrink-0"
                            >
                              Sign out
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky unsaved-changes bar */}
      <AnimatePresence>
        {(hasChanges || toast) && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-xl z-20"
          >
            <div className="glass-card border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between gap-4 shadow-2xl">
              {toast ? (
                <p className="text-green-400 text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {toast}
                </p>
              ) : (
                <>
                  <p className="text-white text-sm">You have unsaved changes.</p>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={discardChanges}
                      disabled={saving}
                      className="px-4 py-2 rounded-full font-label-mono text-xs text-on-surface-variant hover:text-white transition-colors disabled:opacity-50"
                    >
                      Discard
                    </button>
                    <motion.button
                      whileHover={{ scale: canSave ? 1.02 : 1 }}
                      whileTap={{ scale: canSave ? 0.98 : 1 }}
                      onClick={saveSettings}
                      disabled={!canSave || saving}
                      className="bg-primary text-black px-6 py-2.5 rounded-full font-label-mono text-xs font-bold disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}