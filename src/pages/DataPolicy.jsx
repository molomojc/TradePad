import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function DataPolicy() {
  return (
    <PageTransition className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="space-y-4">
        <Link to="/" className="text-primary hover:underline text-sm font-mono flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">Privacy Policy</h1>
        <p className="text-on-surface-variant font-mono text-xs">Last Updated: July 2026</p>
      </div>

      <div className="glass-card p-5 sm:p-8 md:p-12 rounded-2xl md:rounded-[2rem] border-white/5 space-y-8 text-on-surface-variant leading-relaxed text-sm">
        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">1. Information We Collect</h2>
          <p>
            To provide our launch services, we collect limited personal data, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account details:</strong> Email addresses and user profile information.</li>
            <li><strong>Solana Wallet Addresses:</strong> Shared by users to track whitelisting and claims.</li>
            <li><strong>Session Logs:</strong> Heartbeats, login timestamps, and page engagement data to track session durations.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">2. How We Use Information</h2>
          <p>
            We process your information to maintain Platform stability, deliver premium early access countdowns, verify whitelists for Solana token allocations, and provide usage analytics to admins for overall platform health checkups.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">3. Cookies and Tracking</h2>
          <p>
            We use technical cookies and sessionStorage variables to maintain active authentication and link user logs with active session keys. No third-party marketing cookies are utilized on this Platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">4. Data Security</h2>
          <p>
            All connection credentials and profile variables are encrypted securely via Supabase DB infrastructure. We implement strict RLS policies to guarantee only you and verified administrators can query your session activity records.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl text-white font-bold font-display">5. Your Rights</h2>
          <p>
            Under GDPR and other privacy regimes, you retain the right to query, edit, or completely wipe your personal data logs. Contact support to request complete database profile deletions.
          </p>
        </section>
      </div>
    </PageTransition>
  );
}
