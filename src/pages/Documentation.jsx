import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function Documentation() {
  return (
    <PageTransition className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="space-y-4">
        <Link to="/" className="text-primary hover:underline text-sm font-mono flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">TradePad Documentation</h1>
        <p className="text-on-surface-variant font-mono text-xs">Platform Guide & Walkthroughs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Side Navigation */}
        <div className="md:col-span-1 space-y-4">
          <div className="glass-card p-5 rounded-2xl border-white/5 space-y-4 md:sticky md:top-24">
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">Sections</h3>
            <nav className="flex flex-row flex-wrap md:flex-col gap-2 md:gap-2.5 text-xs">
              <a href="#introduction" className="text-on-surface-variant hover:text-white transition-colors">Introduction</a>
              <a href="#how-it-works" className="text-on-surface-variant hover:text-white transition-colors">How it Works</a>
              <a href="#premium-benefits" className="text-on-surface-variant hover:text-white transition-colors">Premium Benefits</a>
              <a href="#whitelist-group" className="text-on-surface-variant hover:text-white transition-colors">Join Whitelists</a>
              <a href="#transparency-proof" className="text-on-surface-variant hover:text-white transition-colors">Vetting & DexScreener</a>
            </nav>
          </div>
        </div>

        {/* Right Column: Documentation Articles */}
        <div className="md:col-span-2 space-y-12 text-on-surface-variant leading-relaxed text-sm">
          
          <section id="introduction" className="space-y-4">
            <h2 className="text-2xl text-white font-bold font-display border-b border-white/5 pb-2">Introduction</h2>
            <p>
              TradePad is a premium Solana memecoin launch utility built around security, schedule consistency, and team-driven vetting processes. We avoid random listings and focus on a curated calendar where launch details are transparently tracked.
            </p>
          </section>

          <section id="how-it-works" className="space-y-4">
            <h2 className="text-2xl text-white font-bold font-display border-b border-white/5 pb-2">How it Works</h2>
            <p>
              The platform executes Solana launches on a fixed schedule (typically every two weeks). Instead of chasing tokens after they have listed, users are provided whitelisting opportunities beforehand, assuring launch equality.
            </p>
          </section>

          <section id="premium-benefits" className="space-y-4">
            <h2 className="text-2xl text-white font-bold font-display border-b border-white/5 pb-2">Premium Benefits</h2>
            <p>
              Premium members receive complete access to the launch portal:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-xs">
              <li>Early viewing access to upcoming launch parameters.</li>
              <li>Participating member registration (joining launches).</li>
              <li>Immediate notification alerts on launch windows.</li>
              <li>Countdown clocks.</li>
            </ul>
          </section>

          <section id="whitelist-group" className="space-y-4">
            <h2 className="text-2xl text-white font-bold font-display border-b border-white/5 pb-2">Join Whitelists</h2>
            <p>
              To register interest in upcoming projects:
            </p>
            <ol className="list-decimal pl-6 space-y-1.5 text-xs">
              <li>Open the dashboard and visit the "Upcoming" launch panel.</li>
              <li>Click **Join Launch**. Your registration will be securely saved in the database.</li>
              <li>Track your joined launches inside the "My Allocations" dashboard.</li>
            </ol>
          </section>

          <section id="transparency-proof" className="space-y-4">
            <h2 className="text-2xl text-white font-bold font-display border-b border-white/5 pb-2">Vetting & DexScreener</h2>
            <p>
              We act as a public portfolio. Every project launched is archived with its mint and pair addresses, letting users audit token stats (price, liquidity, volume, holder count) dynamically using DexScreener verification.
            </p>
          </section>

        </div>

      </div>
    </PageTransition>
  );
}
