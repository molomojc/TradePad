import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Sidebar({ type = 'user', open = false, onClose }) {
  const navigate = useNavigate();
  const userLinks = [
    { name: 'Dashboard', path: '/dashboard/user', icon: 'home', end: true },
    { name: 'Upcoming Launches', path: '/dashboard/user/upcoming', icon: 'rocket_launch' },
    { name: 'Previous Launches', path: '/dashboard/user/previous', icon: 'history' },
    { name: 'My Allocations', path: '/dashboard/user/allocations', icon: 'account_balance_wallet' },
    { name: 'Premium', path: '/dashboard/user/premium', icon: 'star' },
    { name: 'News', path: '/dashboard/user/news', icon: 'newspaper' },
    { name: 'Profile', path: '/dashboard/user/profile', icon: 'person' },
    { name: 'Settings', path: '/dashboard/user/settings', icon: 'settings' },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/dashboard/admin', icon: 'dashboard', end: true },
    { name: 'Launches', path: '/dashboard/admin/launches', icon: 'rocket' },
    { name: 'Premium', path: '/dashboard/admin/premium', icon: 'workspace_premium' },
    { name: 'Users', path: '/dashboard/admin/users', icon: 'group' },
    { name: 'Promote Users', path: '/dashboard/admin/users/promote', icon: 'admin_panel_settings' },
    { name: 'News', path: '/dashboard/admin/news', icon: 'article' },
    { name: 'Analytics', path: '/dashboard/admin/analytics', icon: 'analytics' },
    { name: 'Reports', path: '/dashboard/admin/reports', icon: 'summarize' },
    { name: 'Settings', path: '/dashboard/admin/settings', icon: 'settings_applications' },
  ];

  const links = type === 'admin' ? adminLinks : userLinks;

  const handleSignOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } finally {
      navigate('/');
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        className={`w-64 h-[100dvh] fixed top-0 left-0 bg-white/5 border-r border-white/10 flex flex-col z-50 transition-transform duration-300 ease-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          <Link
            to={type === 'admin' ? '/dashboard/admin' : '/dashboard/user'}
            className="flex items-center hover:opacity-80 transition-opacity"
            onClick={onClose}
          >
            <img src="/HeaderIcon.png" alt="MemLaunch" className="h-10 w-auto block" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center text-white/80"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-label-mono text-[13px] transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-black font-bold shadow-[0_0_15px_rgba(198,198,198,0.1)]'
                    : 'text-on-surface-variant hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              {link.name}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 space-y-2">
          {type === 'admin' ? (
            <Link
              to="/dashboard/user"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-label-mono text-[13px] text-on-surface-variant hover:text-white hover:bg-white/5 transition-all duration-200 w-full"
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
              Switch to User
            </Link>
          ) : (
            <div className="text-[11px] text-on-surface-variant px-4">
              Secure access controls are active.
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-label-mono text-[13px] text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all duration-200 w-full"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
    </aside>
    </>
  );
}
