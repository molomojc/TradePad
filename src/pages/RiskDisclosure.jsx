import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function RiskDisclosure() {
  return (
    <PageTransition className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="space-y-4">
        <Link to="/" className="text-primary hover:underline text-sm font-mono flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">Risk Disclosure</h1>
        <p className="text-on-surface-variant font-mono text-xs">Last Updated: July 2026</p>
      </div>

      <div className="glass-card p-8 md:p-12 rounded-[2rem] border-red-500/10 bg-gradient-to-b from-red-500/5 to-transparent space-y-8 text-on-surface-variant leading-relaxed text-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] pointer-events-none"></div>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">1. High Asset Volatility</h2>
          <p>
            Solana memecoins are highly speculative, volatile, and experimental assets. They frequently experience extreme, rapid fluctuations in price. You should never invest funds that you cannot afford to lose entirely.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">2. Smart Contract Vulnerabilities</h2>
          <p>
            Participation in early allocation listings exposes you to cryptographic smart contract vulnerabilities, bugs, or malicious exploits. TradePad takes every precaution in vetting tokens, but cannot guarantee security.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">3. Lockups & Vesting Risk</h2>
          <p>
            Vesting pools limit instant liquidity. Whitelisted token groups will have custom vesting release profiles (e.g. 20% release blocks). Price changes during locked vesting states will affect final cashout values.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">4. Regulatory Risks</h2>
          <p>
            The regulatory landscape governing blockchain assets is fluid. Changes in national laws, tax treatments, or global securities policies can impact trading accessibility and the platform lifecycle.
          </p>
        </section>

        <section className="space-y-3 border-t border-red-500/20 pt-6">
          <p className="text-white font-semibold">
            By interacting with TradePad launches, you acknowledge and accept these operational risks.
          </p>
        </section>
      </div>
    </PageTransition>
  );
}
