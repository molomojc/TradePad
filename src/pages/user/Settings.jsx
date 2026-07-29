import React, { useEffect, useState } from 'react';
import PageTransition from '../../components/PageTransition';
import { fetchCurrentAccess, hasSupabaseConfig, supabase } from '../../lib/supabase';
import { useRef } from 'react';
import { toast } from 'sonner';

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    if (hasSupabaseConfig && supabase) {
      const { profile } = await fetchCurrentAccess();
      setProfile(profile);
    }

    setLoading(false);
  }
  
  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
  
    if (!file || !profile) return;
  
    setUploading(true);
  
    try {
      const extension = file.name.split('.').pop();
      const filePath = `${profile.id}/avatar.${extension}`;
  
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });
  
      if (uploadError) throw uploadError;
  
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
  
      const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
  
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id);
  
      if (updateError) throw updateError;
  
      setProfile({
        ...profile,
        avatar_url: avatarUrl,
      });
  
      alert('Profile picture updated successfully.');
    } catch (err) {
      alert(err.message);
    }
  
    setUploading(false);
  }

  async function saveProfile() {
    if (!profile) return;

    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        country: profile.country,
      })
      .eq('id', profile.id);

    if (error) {
      alert(error.message);
    } else {
      alert('Profile updated successfully.');
    }

    setSaving(false);
  }

  async function handleCancelMembership() {
    if (!profile) return;
    setIsCanceling(true);

    try {
      const { error } = await supabase
        .from('membership_cancellations')
        .insert({
          profile_id: profile.id,
          reason: cancelReason,
          status: 'pending'
        });

      if (error) throw error;
      
      toast.success('Your cancellation request has been submitted and will be processed shortly.');
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit cancellation request.');
    } finally {
      setIsCanceling(false);
    }
  }

  if (loading) {
    return (
      <PageTransition className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="max-w-5xl mx-auto pb-10 space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-on-surface">
          Account Settings
        </h1>

        <p className="text-on-surface-variant mt-2">
          Manage your personal information and membership.
        </p>
      </div>

      {/* Profile */}

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant dark:bg-[#0a0a0a]/50">

        <h2 className="text-xl font-bold text-on-surface mb-8">
          Profile Information
        </h2>

        <div className="flex flex-col md:flex-row gap-10">

        <div className="flex flex-col items-center">

<img
  src={
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?background=0D1117&color=ffffff&name=${encodeURIComponent(
      `${profile?.first_name || ''} ${profile?.last_name || ''}`
    )}`
  }
  alt="Profile"
  className="w-32 h-32 rounded-full border border-outline-variant object-cover"
/>

<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={uploadAvatar}
/>

<button
  onClick={() => fileInputRef.current?.click()}
  disabled={uploading}
  className="mt-4 px-5 py-2 rounded-xl bg-primary text-black font-semibold"
>
  {uploading ? 'Uploading...' : 'Change Photo'}
</button>

</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">

            <div>
              <label className="text-xs uppercase text-on-surface-variant">
                First Name
              </label>

              <input
                value={profile?.first_name || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    first_name: e.target.value,
                  })
                }
                className="w-full mt-2 bg-surface-variant rounded-xl border border-outline-variant p-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs uppercase text-on-surface-variant">
                Last Name
              </label>

              <input
                value={profile?.last_name || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    last_name: e.target.value,
                  })
                }
                className="w-full mt-2 bg-surface-variant rounded-xl border border-outline-variant p-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs uppercase text-on-surface-variant">
                Username
              </label>

              <input
                value={profile?.username || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    username: e.target.value,
                  })
                }
                className="w-full mt-2 bg-surface-variant rounded-xl border border-outline-variant p-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs uppercase text-on-surface-variant">
                Country
              </label>

              <input
                value={profile?.country || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    country: e.target.value,
                  })
                }
                className="w-full mt-2 bg-white/5 rounded-xl border border-white/10 p-3 text-white"
              />
            </div>

            <div className="md:col-span-2">

              <label className="text-xs uppercase text-on-surface-variant">
                Email Address
              </label>

              <input
                disabled
                value={profile?.email || ''}
                className="w-full mt-2 bg-surface-variant/50 rounded-xl border border-outline-variant p-3 text-on-surface-variant cursor-not-allowed"
              />

            </div>

          </div>

        </div>

        <div className="mt-8 flex justify-end">

          <button
            onClick={saveProfile}
            disabled={saving}
            className="bg-primary text-black px-8 py-3 rounded-xl font-bold"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

        </div>

      </div>

      {/* Membership */}

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant dark:bg-[#0a0a0a]/50">

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-on-surface">
            Membership
          </h2>
          {profile?.access_tier === 'premium' && (
            <button 
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-colors"
            >
              Cancel Membership
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          <div>

            <p className="text-on-surface-variant">
              Current Plan
            </p>

            <h3 className="text-on-surface text-xl font-bold mt-2">
              {profile?.access_tier === 'premium'
                ? 'Premium'
                : 'Free'}
            </h3>

          </div>

          <div>

            <p className="text-on-surface-variant">
              Account Type
            </p>

            <h3 className="text-on-surface text-xl font-bold mt-2 capitalize">
              {profile?.role || 'User'}
            </h3>

          </div>

          <div>

            <p className="text-on-surface-variant">
              Member Since
            </p>

            <h3 className="text-on-surface mt-2">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : '-'}
            </h3>

          </div>

          <div>

            <p className="text-on-surface-variant">
              Status
            </p>

            <span className="inline-flex mt-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400">
              Active
            </span>

          </div>

        </div>

      </div>

      {/* Security */}

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant dark:bg-[#0a0a0a]/50">

        <h2 className="text-xl font-bold text-on-surface mb-6">
          Security
        </h2>

        <button className="bg-surface-variant border border-outline-variant px-6 py-3 rounded-xl text-on-surface hover:bg-surface-variant/80 transition-colors">
          Change Password
        </button>

      </div>

      {/* Danger Zone */}

      <div className="glass-card rounded-3xl border border-red-500/20 p-6 sm:p-8 dark:bg-[#0a0a0a]/50">

        <h2 className="text-red-400 text-xl font-bold">
          Danger Zone
        </h2>

        <p className="text-on-surface-variant mt-3">
          Permanently delete your MemLaunch account and all associated data.
        </p>

        <button className="mt-6 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl text-white font-bold">
          Delete Account
        </button>

      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl p-6 md:p-8 max-w-md w-full border border-outline-variant shadow-2xl dark:bg-[#0a0a0a]">
            <h3 className="text-xl font-bold text-on-surface mb-2">Cancel Premium Membership</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              We're sorry to see you go! Your premium features will remain active until the end of your current billing cycle. 
              Please let us know why you are cancelling so we can improve.
            </p>
            
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              className="w-full bg-surface-variant border border-outline-variant rounded-xl p-3 text-sm text-on-surface h-24 resize-none mb-6 focus:border-primary/50 outline-none"
            ></textarea>
            
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowCancelModal(false)}
                disabled={isCanceling}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:text-white transition-colors"
              >
                Keep Membership
              </button>
              <button 
                onClick={handleCancelMembership}
                disabled={isCanceling}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-50"
              >
                {isCanceling ? 'Submitting...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </PageTransition>
  );
}