import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { fetchCurrentUserProfile, hasSupabaseConfig } from '../lib/supabase';
import useTheme from '../hooks/useTheme';
import TourGuide from '../components/TourGuide';
import { Toaster, toast } from 'sonner';

export default function UserLayout() {
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLight, toggleTheme } = useTheme();

  useEffect(() => {
    let mounted = true;
    fetchCurrentUserProfile().then(({ profile: nextProfile }) => { 
      if (mounted) {
        setProfile(nextProfile);
        if (nextProfile) {
          import('../lib/tracking').then(({ startTrackingSession }) => {
            startTrackingSession(nextProfile.id, nextProfile.email);
          });
        }
      } 
    });
    return () => { 
      mounted = false; 
      import('../lib/tracking').then(({ stopTrackingSession }) => {
        stopTrackingSession();
      });
    };
  }, []);

  const fullName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : '';
  const displayName = fullName || profile?.email || (hasSupabaseConfig ? 'Account' : 'Jacob Miller');
  const isPremium = profile?.access_tier === 'premium' || profile?.is_premium;

  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-background text-on-background">
      <Sidebar type="user" open={sidebarOpen} onClose={() => setSidebarOpen(false)} isPremium={isPremium} />
      <main className="relative flex min-h-screen min-w-0 flex-1 flex-col md:ml-[260px]">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-outline-variant bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className="header-icon-button md:hidden" aria-label="Open navigation"><span className="material-symbols-outlined text-[20px]">menu</span></button>
            <div data-tour="search" className="relative hidden w-[min(34vw,420px)] sm:block">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-on-surface-variant">search</span>
              <input type="search" placeholder="Search launches, allocations, news..." className="w-full bg-surface border border-outline-variant rounded-lg py-2 pl-10 pr-12 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" aria-label="Search workspace" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-outline-variant px-1.5 py-0.5 text-[9px] text-on-surface-variant/40">⌘ K</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button data-tour="theme" type="button" onClick={() => { toggleTheme(); toast.success(`Switched to ${isLight ? 'dark' : 'light'} mode`); }} className="header-icon-button" aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}><span className="material-symbols-outlined text-[19px]">{isLight ? 'dark_mode' : 'light_mode'}</span></button>
            <button data-tour="tour-btn" type="button" onClick={() => window.dispatchEvent(new CustomEvent('launch-tradepad-tour'))} className="header-icon-button" aria-label="Restart tour guide" title="Restart tour guide"><span className="material-symbols-outlined text-[19px]">help_outline</span></button>
            <button type="button" onClick={() => toast.info('You have no new notifications')} className="header-icon-button relative" aria-label="Notifications"><span className="material-symbols-outlined text-[19px]">notifications</span><span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-neon-red ring-2 ring-background" /></button>
            <div className="mx-1 hidden h-6 w-px bg-outline-variant sm:block" />
            <button data-tour="profile" type="button" className="flex items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-surface-variant/50">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile Avatar" 
                  className="h-8 w-8 rounded-lg object-cover ring-1 ring-outline-variant shrink-0" 
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-surface-container-low to-surface-variant text-xs font-semibold text-on-surface ring-1 ring-outline-variant shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden max-w-36 sm:block">
                <p className="truncate text-xs font-semibold text-on-surface">{displayName}</p>
                <p className="mt-0.5 text-[10px] text-on-surface-variant">{isPremium ? 'Premium account' : 'Free account'}</p>
              </div>
              <span className="material-symbols-outlined hidden text-[16px] text-on-surface-variant sm:block">expand_more</span>
            </button>
          </div>
        </header>
        <div data-tour="main-content" className="flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-8"><Outlet /></div>
      </main>
      <Toaster 
        theme={isLight ? 'light' : 'dark'} 
        toastOptions={{
          style: {
            background: isLight ? '#ffffff' : '#1e1e1e',
            color: isLight ? '#121212' : '#e0e0e0',
            border: `1px solid ${isLight ? '#e5e7eb' : '#333333'}`
          }
        }} 
      />
      <TourGuide />
    </div>
  );
}
