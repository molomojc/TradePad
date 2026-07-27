import React from 'react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Free',
    price: '$0',
    interval: '/month',
    accent: 'border-white/10',
    highlight: false,
    features: ['Browse launches', 'Countdown timers', 'Previous launches', 'Community news'],
    cta: 'Get Started',
    ctaTo: '/dashboard/user/upcoming',
  },
  {
    name: 'Premium',
    price: '$19.99',
    interval: '/month',
    accent: 'border-primary/30',
    highlight: true,
    features: ['Premium reports', 'AI analysis', 'Launch research', 'Unlimited access', 'Priority notifications'],
    cta: 'Upgrade Now',
    ctaTo: '/dashboard/user/premium',
  },
  {
    name: 'Annual',
    price: '$199',
    interval: '/year',
    accent: 'border-purple-500/30',
    highlight: false,
    features: ['Everything in Premium', 'Best value for annual members', 'Priority support', 'Locked-in pricing'],
    cta: 'Go Annual',
    ctaTo: '/dashboard/user/premium',
  },
];

function StatPill({ label, value }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-mono">{label}</p>
      <p className="text-white font-bold mt-1">{value}</p>
    </div>
  );
}

export default function MoneyTree({ role = 'user', metrics = {}, subscription = null }) {
  const totalPremiumMembers = metrics?.premium_users ?? metrics?.premiumMembers ?? 0;
  const monthlyRecurringRevenue = metrics?.monthly_mrr ?? metrics?.mrr ?? 0;
  const annualRecurringRevenue = metrics?.arr ?? Number(monthlyRecurringRevenue) * 12;
  const activeSubscriptions = metrics?.active_subscriptions ?? metrics?.activeSubs ?? totalPremiumMembers;
  const failedPayments = metrics?.failed_payments ?? 0;
  const isAdmin = role === 'admin';

  return (
    <div className="glass-card rounded-[2rem] p-6 md:p-8 border-white/10 relative overflow-hidden">
      <div className="absolute -top-24 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 bg-primary/15 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-label-mono tracking-wider uppercase">
              The Almighty Money Tree
            </span>
            <h2 className="text-2xl md:text-3xl font-display-lg text-white font-bold mt-4">Subscription engine and billing summary</h2>
            <p className="text-on-surface-variant text-sm max-w-2xl mt-2">
              {isAdmin
                ? 'Monitor plan mix, recurring revenue, and subscription health from the admin dashboard.'
                : 'Review the plan that powers your access and upgrade when you are ready to unlock more.'}
            </p>
          </div>
          {subscription && (
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 min-w-[220px]">
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-mono">Current Plan</p>
              <p className="text-white font-bold mt-1">{subscription.plans?.name || subscription.name || 'Premium'}</p>
              <p className="text-[11px] text-on-surface-variant mt-1 capitalize">{subscription.status || 'active'}</p>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            <StatPill label="Premium Members" value={totalPremiumMembers.toLocaleString()} />
            <StatPill label="MRR" value={`$${Number(monthlyRecurringRevenue || 0).toLocaleString()}`} />
            <StatPill label="ARR" value={`$${Number(annualRecurringRevenue || 0).toLocaleString()}`} />
            <StatPill label="Active Subs" value={activeSubscriptions.toLocaleString()} />
            <StatPill label="Failed Payments" value={failedPayments.toLocaleString()} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-6 border ${plan.accent} bg-white/5 ${plan.highlight ? 'shadow-[0_0_30px_rgba(212,255,0,0.08)]' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-white font-bold text-lg">{plan.name}</p>
                  <p className="text-on-surface-variant text-[13px] mt-1">
                    {plan.name === 'Free' ? 'Public browsing' : plan.name === 'Premium' ? 'Monthly growth plan' : 'Best value'}
                  </p>
                </div>
                <span className={`text-[10px] font-label-mono px-2 py-1 rounded-full border ${plan.highlight ? 'bg-primary/15 text-primary border-primary/20' : 'bg-white/5 text-on-surface-variant border-white/10'}`}>
                  {plan.highlight ? 'Recommended' : plan.name}
                </span>
              </div>

              <div className="flex items-end gap-2 mb-5">
                <h3 className="text-4xl font-display-lg text-white font-bold">{plan.price}</h3>
                <span className="text-on-surface-variant text-sm pb-1">{plan.interval}</span>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm text-white">
                    <span className={`material-symbols-outlined text-[18px] ${plan.highlight ? 'text-primary' : 'text-green-400'}`}>
                      check_circle
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                to={plan.ctaTo}
                className={`block text-center py-3 rounded-xl font-label-mono text-xs font-bold transition-all ${
                  plan.highlight ? 'bg-primary text-black hover:opacity-90' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
