import React, { useState, useEffect } from 'react';
import PageTransition from '../../components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import { ensureProfileRow, fetchCurrentUserProfile } from '../../lib/supabase';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function truncateAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
      <p className="text-[11px] uppercase tracking-wider font-label-mono text-on-surface-variant mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        {icon && <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>}
        <p className="text-white font-bold text-lg">{value}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ full_name: '', username: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { profile: currentProfile, session } = await fetchCurrentUserProfile();

      if (!session?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const mergedProfile = currentProfile || {
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
        username: session.user.user_metadata?.username || (session.user.email ? session.user.email.split('@')[0] : 'user'),
        email: session.user.email || '',
        role: 'user',
        access_tier: 'free',
        joined_at: session.user.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        wallet_address: null,
        launches_joined: 0,
        bio: '',
        avatar_url: null,
        is_premium: false,
      };

      setProfile({
        ...mergedProfile,
        joined_at: mergedProfile.created_at || mergedProfile.joined_at,
        launches_joined: mergedProfile.launches_joined ?? 0,
      });
      setDraft({
        full_name: mergedProfile.full_name || '',
        username: mergedProfile.username || '',
        bio: mergedProfile.bio || '',
      });

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const startEditing = () => {
    setDraft({ full_name: profile.full_name || '', username: profile.username || '', bio: profile.bio || '' });
    setIsEditing(true);
  };

  const cancelEditing = () => setIsEditing(false);

  const saveEditing = async () => {
    setSaving(true);
    const user = { id: profile.id, email: profile.email, user_metadata: { full_name: draft.full_name } };
    const { error, profile: savedProfile } = await ensureProfileRow(user, {
      full_name: draft.full_name,
      username: draft.username,
      bio: draft.bio,
      wallet_address: profile.wallet_address,
      avatar_url: profile.avatar_url,
      is_premium: profile.access_tier === 'premium' || profile.is_premium,
    });
    if (error) {
      setSaving(false);
      alert(error.message || 'Unable to save profile right now.');
      return;
    }
    setProfile((prev) => ({ ...prev, ...savedProfile, ...draft }));
    setSaving(false);
    setIsEditing(false);
  };

  const copyAddress = () => {
    if (!profile?.wallet_address) return;
    navigator.clipboard?.writeText(profile.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleNotifications = (val) => {
    setSettings((prev) => ({ ...prev, notifications_enabled: val }));
  };

  if (loading) {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </PageTransition>
    );
  }

  if (!profile) {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card rounded-3xl border-white/5 p-8 text-center max-w-lg">
          <h1 className="text-2xl font-display-lg text-white font-bold mb-3">Profile unavailable</h1>
          <p className="text-on-surface-variant">Sign in again so we can load your profile record.</p>
        </div>
      </PageTransition>
    );
  }

  const memberSince = new Date(profile.joined_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <PageTransition className="max-w-4xl mx-auto">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        <motion.div variants={itemVariants} className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-3xl font-display-lg font-bold text-white mb-2">Profile</h1>
            <p className="text-on-surface-variant text-sm">Manage your account details and identity.</p>
          </div>

          {!isEditing ? (
            <button
              onClick={startEditing}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all px-5 py-2.5 rounded-full font-label-mono font-bold text-xs text-white"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="px-5 py-2.5 rounded-full font-label-mono font-bold text-xs text-on-surface-variant hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEditing}
                disabled={saving}
                className="bg-primary text-black hover:opacity-90 active:scale-95 transition-all px-5 py-2.5 rounded-full font-label-mono font-bold text-xs disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </motion.div>

        {/* Identity card */}
        <motion.div variants={itemVariants} className="glass-card p-8 border-white/5 rounded-3xl space-y-8">
          <div className="flex items-center gap-6">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display-lg text-3xl font-bold border border-primary/30 shadow-[0_0_20px_rgba(212,255,0,0.2)] overflow-hidden">
                {profile.full_name.charAt(0)}
              </div>
              <button
                onClick={() => alert('Simulating photo upload...')}
                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200"
              >
                <span className="material-symbols-outlined text-white text-[20px]">photo_camera</span>
              </button>
            </div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={draft.full_name}
                  onChange={(e) => setDraft((d) => ({ ...d, full_name: e.target.value }))}
                  className="bg-white/5 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-2 text-white text-xl font-bold outline-none transition-all w-full max-w-sm"
                />
              ) : (
                <h2 className="text-2xl text-white font-bold">{profile.full_name}</h2>
              )}
              <p className="text-on-surface-variant mt-1">{profile.email}</p>
              <p className="text-on-surface-variant text-sm mt-1">@{profile.username || 'user'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-[12px] font-label-mono capitalize">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">badge</span>
              {profile.role}
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[12px] font-label-mono font-bold capitalize">
              <span className="material-symbols-outlined text-[16px]">star</span>
              {profile.access_tier} tier
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 border-t border-white/5">
            <StatCard label="Member Since" value={memberSince} />
            <StatCard label="Launches Joined" value={profile.launches_joined} />
            <StatCard label="Bio" value={profile.bio || 'Not set'} icon="description" />
          </div>
        </motion.div>

        {/* Wallet card */}
        <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 border-white/5 rounded-3xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm">Connected via Phantom</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-label-mono text-[12px] text-on-surface-variant truncate">
                    {truncateAddress(profile.wallet_address)}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="text-on-surface-variant/60 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => alert('Simulating wallet disconnect...')}
              className="px-4 py-2 rounded-full font-label-mono text-xs text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-colors shrink-0"
            >
              Disconnect
            </button>
          </div>
        </motion.div>

        {/* Premium upsell — only relevant for free tier */}
        {profile.access_tier === 'free' && (
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-3xl p-6 md:p-8 border-purple-500/20 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-500/15 blur-3xl"></div>
            <span className="absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-label-mono text-[10px] tracking-wide whitespace-nowrap">
              ~15 MIN HEAD START
            </span>
            <div className="relative z-10 max-w-lg">
              <span className="text-[11px] font-label-mono text-purple-400 tracking-wider uppercase block mb-3">
                Upgrade available
              </span>
              <h3 className="text-xl font-bold text-white mb-2">See launches before the public feed</h3>
              <p className="text-on-surface-variant text-[14px] leading-relaxed mb-6">
                Premium unlocks conviction scoring and a head start on every new listing.
              </p>
              <button
                onClick={() => alert('Redirecting to subscription portal...')}
                className="bg-[#8b5cf6] text-white hover:bg-[#7c3aed] active:scale-95 transition-all px-6 py-3 rounded-full font-label-mono font-bold text-xs shadow-[0_4px_15px_rgba(139,92,246,0.25)]"
              >
                Upgrade to Premium
              </button>
            </div>
          </motion.div>
        )}

        {/* Danger zone */}
        <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 border-red-400/10 rounded-3xl">
          <h3 className="text-lg font-bold text-white mb-1">Account</h3>
          <p className="text-on-surface-variant text-[13px] mb-5">Sign out of this device, or permanently delete your account.</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => alert('Simulating log out...')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-label-mono font-bold text-xs text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Log Out
            </button>
            <button
              onClick={() => alert('Simulating account deletion flow...')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-label-mono font-bold text-xs text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">delete_forever</span>
              Delete Account
            </button>
          </div>
        </motion.div>

      </motion.div>
    </PageTransition>
  );
}
