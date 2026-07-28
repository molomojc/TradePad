import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function TermsOfService() {
  return (
    <PageTransition className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="space-y-4">
        <Link to="/" className="text-primary hover:underline text-sm font-mono flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">Terms of Service</h1>
        <p className="text-on-surface-variant font-mono text-xs">Last Updated: July 2026</p>
      </div>

      <div className="glass-card p-8 md:p-12 rounded-[2rem] border-white/5 space-y-8 text-on-surface-variant leading-relaxed text-sm">
        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the TradePad platform (the "Platform"), you agree to be bound by these Terms of Service. If you do not agree, you must not access or use the Platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">2. Description of Services</h2>
          <p>
            TradePad is a token launch coordination platform. It offers a structured calendar for Solana-based token launches. It provides early access details, whitelist registration, and token allocation tracking for Premium members.
          </p>
          <p className="text-white font-semibold">
            TradePad is not a cryptocurrency exchange, broker-dealer, or financial advisor. All token launches are speculative assets.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">3. Subscription Tiers & Billing</h2>
          <p>
            The Platform offers Free and Premium subscription tiers. Premium access requires monthly recurring billing. Subscriptions are processed securely and are non-refundable except where required by law. You may cancel your subscription at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">4. Token Launches & Participation</h2>
          <p>
            Registering for a token launch ("joining a launch group") does not guarantee a successful allocation or financial profit. Token allocation availability is limited and subject to smart contract rules and conditions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">5. User Conduct & Security</h2>
          <p>
            You are solely responsible for maintaining the security of your accounts and connected Solana wallets. TradePad will never ask for your private keys or seed phrases. You must report any unauthorized access immediately.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, TradePad shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of the Platform or participation in token launches.
          </p>
        </section>
      </div>
    </PageTransition>
  );
}
