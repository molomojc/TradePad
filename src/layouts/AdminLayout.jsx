import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import useTheme from '../hooks/useTheme';
import { fetchCurrentUserProfile } from '../lib/supabase';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const { isLight, toggleTheme } = useTheme();

  useEffect(() => {
    fetchCurrentUserProfile().then(({ profile: nextProfile }) => {
      setProfile(nextProfile);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background flex overflow-x-hidden">
      <Sidebar type="admin" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area next to Sidebar */}
      <main className="flex-1 flex flex-col min-h-screen relative bg-background md:ml-[260px]">
        {/* Top Header */}
        <header className="h-20 border-b border-outline-variant bg-background/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-10 h-10 rounded-full border border-outline-variant bg-surface flex items-center justify-center text-on-surface"
              aria-label="Open navigation"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <div className="font-display-lg text-lg text-on-surface font-bold">
              Admin Portal
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-outline-variant bg-surface flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors"
              aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
              title={isLight ? 'Dark mode' : 'Light mode'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isLight ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant/50 transition-colors">
              notifications
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Admin Avatar" 
                  className="w-8 h-8 rounded-full object-cover border border-red-500/30" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center font-bold text-red-500 text-sm">
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <span className="font-mono text-sm text-on-surface hidden md:block">
                {profile?.full_name || 'SuperAdmin'}
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
