import React from 'react';

export default function Transparency() {
  return (
    <div className="px-6 md:px-margin-desktop py-24 min-h-screen text-left relative animate-in fade-in duration-300">
      <div className="glow-sphere w-[450px] h-[450px] bg-primary/5 bottom-10 left-1/3"></div>

      <div className="mb-12 max-w-3xl">
        <span className="font-label-mono text-primary bg-primary/10 px-3 py-1 rounded-full text-caption border border-primary/20">
          SYSTEM TRANSPARENCY
        </span>
        <h1 className="font-display-lg text-3xl md:text-headline-lg text-white mt-4 mb-2">Audit-ready data model</h1>
        <p className="text-on-surface-variant max-w-xl font-body-md">
          TradePad is being structured around live launch records, premium research, archive history, and subscription data stored in Supabase.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-card rounded-[2rem] p-6 md:p-8">
          <h3 className="font-headline-md text-white text-[20px] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">database</span>
            Core tables
          </h3>
          <p className="text-on-surface-variant text-[14px] leading-relaxed">
            Profiles, plans, subscriptions, launches, launch metrics, updates, research, watchlists, notifications, and platform metrics.
          </p>
        </div>

        <div className="lg:col-span-2 glass-card rounded-[2rem] p-6 md:p-8">
          <h3 className="font-headline-md text-white text-[20px] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">verified_user</span>
            Product safeguards
          </h3>
          <div className="space-y-3 text-[14px] text-on-surface-variant">
            <p>Role-based access separates free, premium, and admin views.</p>
            <p>Launch data supports both public history and premium-only research layers.</p>
            <p>Supabase indexes are included for launch status, chain, updates, and news performance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
