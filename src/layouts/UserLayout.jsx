import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { fetchCurrentUserProfile, hasSupabaseConfig } from '../lib/supabase';
import useTheme from '../hooks/useTheme';

export default function UserLayout() {
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLight, toggleTheme } = useTheme();

  useEffect(() => {
    let mounted = true;
    fetchCurrentUserProfile().then(({ profile: nextProfile }) => { if (mounted) setProfile(nextProfile); });
    return () => { mounted = false; };
  }, []);

  const displayName = profile?.full_name || profile?.email || (hasSupabaseConfig ? 'Account' : 'Jacob Miller');

  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-background text-on-background">
      <Sidebar type="user" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="relative flex min-h-screen min-w-0 flex-1 flex-col md:ml-[260px]">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-white/[0.07] bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className="header-icon-button md:hidden" aria-label="Open navigation"><span className="material-symbols-outlined text-[20px]">menu</span></button>
            <div className="relative hidden w-[min(34vw,420px)] sm:block">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-on-surface/30">search</span>
              <input type="search" placeholder="Search launches, allocations, news..." className="dashboard-search" aria-label="Search workspace" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-on-surface/25">⌘ K</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={toggleTheme} className="header-icon-button" aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}><span className="material-symbols-outlined text-[19px]">{isLight ? 'dark_mode' : 'light_mode'}</span></button>
            <button type="button" className="header-icon-button relative" aria-label="Notifications"><span className="material-symbols-outlined text-[19px]">notifications</span><span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-neon-red ring-2 ring-background" /></button>
            <div className="mx-1 hidden h-6 w-px bg-white/[0.08] sm:block" />
            <button type="button" className="flex items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-white/[0.04]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#3a3a3c] to-[#1a1a1c] text-xs font-semibold text-white ring-1 ring-white/10">{displayName.charAt(0).toUpperCase()}</div>
              <div className="hidden max-w-36 sm:block"><p className="truncate text-xs font-semibold text-on-surface/85">{displayName}</p><p className="mt-0.5 text-[10px] text-on-surface/35">Premium account</p></div>
              <span className="material-symbols-outlined hidden text-[16px] text-on-surface/30 sm:block">expand_more</span>
            </button>
          </div>
        </header>
        <div className="flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-8"><Outlet /></div>
      </main>
    </div>
  );
}
