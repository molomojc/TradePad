import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';

export default function PaymentCancelled() {
  return (
    <PageTransition className="max-w-3xl mx-auto py-20">
      <div className="glass-card rounded-[2rem] p-10 border-white/10 text-center">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">error</span>
        <h1 className="text-4xl font-display-lg font-bold text-white mb-4">Payment Cancelled</h1>
        <p className="text-on-surface-variant max-w-xl mx-auto mb-8">
          Your payment was not completed. No charges were made, and you can safely try again anytime.
        </p>
        <Link to="/pricing" className="inline-flex bg-primary text-black px-6 py-3 rounded-xl font-label-mono font-bold text-sm">
          Try Again
        </Link>
      </div>
    </PageTransition>
  );
}
