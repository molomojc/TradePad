import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import useTheme from '../hooks/useTheme';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { isLight, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-on-background flex overflow-x-hidden">
      <Sidebar type="admin" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area next to Sidebar */}
      <main className="flex-1 flex flex-col min-h-screen relative bg-[#0a0a0a] md:ml-64">
        {/* Top Header */}
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
            <div className="font-display-lg text-lg text-white">
              Admin Portal
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
            <button className="material-symbols-outlined text-on-surface-variant hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors">
              notifications
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center font-bold text-red-500 text-sm">
                A
              </div>
              <span className="font-label-mono text-sm text-white hidden md:block">SuperAdmin</span>
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
