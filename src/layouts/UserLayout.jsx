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
    fetchCurrentUserProfile().then(({ profile }) => {
      if (mounted) setProfile(profile);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background flex overflow-x-hidden">
      {/* Sidebar fixed on the left */}
      <Sidebar type="user" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area next to Sidebar */}
      <main className="flex-1 flex flex-col min-h-screen relative md:ml-64">
        <header className="h-20 border-b border-white/10 bg-background/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white"
              aria-label="Open navigation"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            {/* Global Search */}
            <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 gap-3 focus-within:border-primary/50 transition-all w-full max-w-md">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search launches, tokens..."
                className="bg-transparent border-none focus:ring-0 p-0 text-[14px] text-white placeholder:text-on-surface-variant/50 outline-none w-full min-w-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/10 transition-colors"
              aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
              title={isLight ? 'Dark mode' : 'Light mode'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isLight ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors relative">
              notifications
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center font-bold text-black text-sm">
                {(profile?.full_name || profile?.email || 'User').charAt(0).toUpperCase()}
              </div>
              <span className="font-label-mono text-sm text-white hidden md:block">
                {profile?.full_name || profile?.email || (hasSupabaseConfig ? 'Guest' : 'Connect Supabase')}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
