import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Sidebar({ type = 'user', open = false, onClose, isPremium = false }) {
  const navigate = useNavigate();
  const userLinks = [
    { name: 'Overview', path: '/dashboard/user', icon: 'space_dashboard', end: true },
    { name: 'Live launches', path: '/dashboard/user/live', icon: 'sensors' },
    { name: 'Upcoming launches', path: '/dashboard/user/upcoming', icon: 'rocket_launch' },
    { name: 'Previous launches', path: '/dashboard/user/previous', icon: 'history' },
    { name: 'My allocations', path: '/dashboard/user/allocations', icon: 'account_balance_wallet' },
    { name: 'Courses', path: '/dashboard/user/courses', icon: 'school' },
    { name: 'News & research', path: '/dashboard/user/news', icon: 'newspaper' },
  ];
  const adminLinks = [
    { name: 'Overview', path: '/dashboard/admin', icon: 'space_dashboard', end: true },
    { name: 'Launches', path: '/dashboard/admin/launches', icon: 'rocket_launch' },
    { name: 'Courses', path: '/dashboard/admin/courses', icon: 'school' },
    { name: 'Premium', path: '/dashboard/admin/premium', icon: 'workspace_premium' },
    { name: 'Users', path: '/dashboard/admin/users', icon: 'group' },
    { name: 'Promote users', path: '/dashboard/admin/users/promote', icon: 'admin_panel_settings' },
    { name: 'News', path: '/dashboard/admin/news', icon: 'article' },
    { name: 'Analytics', path: '/dashboard/admin/analytics', icon: 'monitoring' },
    { name: 'Reports', path: '/dashboard/admin/reports', icon: 'summarize' },
  ];
  const links = type === 'admin' ? adminLinks : userLinks;

  const handleSignOut = async () => {
    try { if (supabase) await supabase.auth.signOut(); }
    finally { navigate('/'); }
  };

  return (
    <>
      <button type="button" aria-label="Close navigation" onClick={onClose} className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity md:hidden ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside data-tour="sidebar" className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-[260px] flex-col border-r border-outline-variant bg-surface transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center justify-between border-b border-outline-variant px-6">
          <Link to={type === 'admin' ? '/dashboard/admin' : '/dashboard/user'} onClick={onClose} className="flex min-w-0 items-center">
            <img src="/HeaderIcon.png" alt="MemLaunch" className="h-10 w-auto max-w-[190px] object-contain object-left" />
          </Link>
          <button type="button" onClick={onClose} className="text-on-surface-variant md:hidden" aria-label="Close sidebar"><span className="material-symbols-outlined">close</span></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/40">Workspace</p>
          <div className="space-y-1">
            {links.map((link) => (
              <NavLink key={link.name} to={link.path} end={link.end} onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                {({ isActive }) => <><span className={`material-symbols-outlined text-[19px] ${isActive ? 'text-neon-red' : ''}`}>{link.icon}</span><span>{link.name}</span></>}
              </NavLink>
            ))}
          </div>

          {type === 'user' && <>
            <p className="px-3 pb-2 pt-7 text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/40">Account</p>
            <div className="space-y-1">
              <NavLink to="/dashboard/user/premium" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}><span className="material-symbols-outlined text-[19px] text-amber-400">workspace_premium</span><span>Premium</span></NavLink>
              <NavLink to="/dashboard/user/settings" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}><span className="material-symbols-outlined text-[19px]">settings</span><span>Settings</span></NavLink>
            </div>
          </>}
        </nav>

        <div className="p-3">
          {type === 'user' && (
            isPremium ? (
              <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full blur-xl pointer-events-none"></div>
                 <div className="flex items-center gap-2 text-xs font-mono font-bold text-on-surface relative z-10">
                  <span className="material-symbols-outlined text-[17px] text-primary">workspace_premium</span> 
                  Premium Member
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant relative z-10">Priority access is active on your account.</p>
              </div>
            ) : (
              <div className="mb-3 rounded-xl border border-outline-variant bg-surface-container-high p-4 hover:border-outline/20 transition-colors">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-on-surface">
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant/60">explore</span> 
                  Free Account
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant mb-3">Upgrade to unlock early launch details.</p>
                <Link to="/dashboard/user/premium" onClick={onClose} className="block w-full py-2 text-center rounded-lg bg-primary text-black text-[10px] font-mono font-bold tracking-wide hover:scale-105 transition-transform shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                  UPGRADE NOW
                </Link>
              </div>
            )
          )}
          {type === 'admin' && <Link to="/dashboard/user" onClick={onClose} className="sidebar-link"><span className="material-symbols-outlined text-[19px]">person</span>Switch to user</Link>}
          <button type="button" onClick={handleSignOut} className="sidebar-link w-full hover:!text-red-300"><span className="material-symbols-outlined text-[19px]">logout</span>Sign out</button>
        </div>
      </aside>
    </>
  );
}
