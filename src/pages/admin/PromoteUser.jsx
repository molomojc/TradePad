import React, { useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';

export default function PromoteUser() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      if (supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, username, role, access_tier, is_premium, created_at')
          .order('created_at', { ascending: false });

        if (!error && active) setUsers(data ?? []);
      }
      if (active) setLoading(false);
    };

    if (!hasSupabaseConfig) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    loadUsers().catch(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const promoteUser = async (profileId) => {
    if (!supabase) return;
    try {
      setSavingId(profileId);
      setMessage('');

      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin', access_tier: 'admin', is_premium: true, updated_at: new Date().toISOString() })
        .eq('id', profileId);

      if (error) throw error;

      await supabase.from('admin_profiles').upsert({
        profile_id: profileId,
        admin_title: 'Administrator',
        last_admin_login_at: new Date().toISOString(),
      });

      setUsers((current) =>
        current.map((user) =>
          user.id === profileId
            ? { ...user, role: 'admin', access_tier: 'admin', is_premium: true }
            : user
        )
      );
      setMessage('User promoted to admin successfully.');
    } catch (error) {
      console.error('Promotion failed', error);
      setMessage(error?.message || 'Promotion failed.');
    } finally {
      setSavingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const text = `${user.full_name || ''} ${user.email || ''} ${user.username || ''}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display-lg font-bold text-white mb-2">Promote Users</h1>
          <p className="text-on-surface-variant text-sm">Upgrade a profile to admin so it can access both user and admin dashboards.</p>
        </div>

        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 gap-2 focus-within:border-primary/50 transition-all w-full md:w-72">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="bg-transparent border-none focus:ring-0 p-0 text-[13px] text-white placeholder:text-on-surface-variant/50 outline-none w-full"
          />
        </div>
      </div>

      {message && (
        <div className="glass-card p-4 rounded-2xl border-white/5 text-on-surface-variant">
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl border-white/5 overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 text-[11px] font-label-mono text-on-surface-variant uppercase tracking-wider border-b border-white/5">
            <span>User</span>
            <span>Role</span>
            <span>Tier</span>
            <span>Admin Profile</span>
            <span>Action</span>
          </div>

          <div className="divide-y divide-white/5">
            {filteredUsers.map((user) => {
              const isAdmin = user.role === 'admin';
              return (
                <div key={user.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center">
                  <div>
                    <p className="text-white font-bold">{user.full_name || user.username || user.email}</p>
                    <p className="text-on-surface-variant text-sm">{user.email}</p>
                  </div>
                  <p className="text-white text-sm capitalize">{user.role}</p>
                  <p className="text-white text-sm capitalize">{user.access_tier}</p>
                  <p className="text-white text-sm">{isAdmin ? 'Linked' : 'Not linked'}</p>
                  <button
                    type="button"
                    onClick={() => promoteUser(user.id)}
                    disabled={isAdmin || savingId === user.id}
                    className="px-4 py-2 rounded-xl bg-primary text-black font-label-mono text-xs font-bold disabled:opacity-50"
                  >
                    {savingId === user.id ? 'Saving...' : isAdmin ? 'Already Admin' : 'Promote'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
