import React, { useState, useEffect, useRef } from 'react';

/* ---------- Scroll-reveal wrapper ---------- */
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- Small pill used for wallets / allocation amounts ---------- */
function Chip({ children }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-label-mono text-white/90 bg-white/5 border border-white/10">
      {children}
    </span>
  );
}

export default function HowItWorks() {
  const [activeFaq, setActiveFaq] = useState(null);

  const steps = [
    {
      num: '01',
      title: 'Create Your Account',
      tagline: 'Create your free account in minutes.',
      icon: 'person_add',
      items: ['Register with your email', 'Verify your account', 'Access your personal dashboard'],
    },
    {
      num: '02',
      title: 'Connect Your Wallet',
      tagline: 'Securely connect your preferred Solana wallet.',
      icon: 'account_balance_wallet',
      chips: ['Phantom', 'Backpack', 'Solflare'],
      note: 'No private key or seed phrase requested — your assets always remain under your control.',
      items: [],
    },
    {
      num: '03',
      title: 'Explore the Upcoming Launch',
      tagline: 'Every two weeks, our team prepares a brand-new community launch.',
      icon: 'explore',
      items: ['Countdown timer & launch date', 'Project overview & tokenomics', 'Supply & community updates'],
      note: 'Premium members get early research and insights before public release.',
    },
    {
      num: '04',
      title: 'Join the Launch',
      tagline: 'When registrations open, choose how much you want to participate with.',
      icon: 'rocket_launch',
      chips: ['0.25 SOL', '0.5 SOL', '1 SOL', 'Custom'],
      note: 'Review estimated fees and slippage before you confirm.',
      items: [],
    },
    {
      num: '05',
      title: 'Launch Day',
      tagline: 'When the countdown hits zero, the token officially launches.',
      icon: 'celebration',
      items: ['Market cap & liquidity', 'Trading volume & holder count', 'Live chart & recent transactions'],
      badge: 'LIVE',
    },
    {
      num: '06',
      title: 'Monitor Performance',
      tagline: 'Track everything directly from your secure dashboard.',
      icon: 'monitoring',
      items: ['Holdings & current value', 'Profit & loss (P&L)', 'Live alerts & notifications'],
    },
  ];

  const faqs = [
    {
      q: 'Do I need crypto experience?',
      a: 'No. The platform is designed to be accessible for both beginners and experienced traders, with clean charts and simple participation options.',
    },
    {
      q: 'Is my wallet safe?',
      a: 'Yes. Your wallet stays under your control at all times. We never request your seed phrase or private keys, and every transaction is signed locally.',
    },
    {
      q: 'How often do launches happen?',
      a: 'New community launches take place every two weeks, each announced in advance with a live countdown visible to all members.',
    },
    {
      q: 'Can anyone join?',
      a: 'Yes. Anyone with a supported Solana wallet can create a free account and participate. Upgrading to Premium unlocks additional research and analytics.',
    },
    {
      q: 'Is profit guaranteed?',
      a: 'No. All cryptocurrency investments carry risk. Market performance depends on many factors, so please review the risk documentation before participating.',
    },
  ];

  const toggleFaq = (idx) => setActiveFaq(activeFaq === idx ? null : idx);

  return (
    <div className="px-6 md:px-margin-desktop py-24 min-h-screen text-left relative animate-in fade-in duration-500">

      {/* Background glowing bubbles */}
 
      {/* Intro Header */}
      <Reveal>
        <section className="max-w-3xl mb-24">
          <span className="font-label-mono text-primary bg-primary/10 px-3.5 py-1.5 rounded-full text-caption border border-primary/20 tracking-wider">
            PLATFORM WORKFLOW
          </span>
          <h1 className="font-display-lg text-4xl md:text-5xl text-white mt-6 mb-4 font-bold tracking-tight">
            Welcome to Fair Launches
          </h1>
          <p className="text-on-surface-variant font-body-lg leading-relaxed">
            Unlike traditional memecoin trading where you discover projects after they've already pumped, our
            platform gives members the opportunity to participate from the very beginning. Every launch follows a
            transparent, audited process designed to provide fair access.
          </p>
        </section>
      </Reveal>

      {/* Steps Timeline */}
      <section className="mb-28">
        <Reveal>
          <div className="flex items-center gap-3 mb-14">
            <h2 className="font-display-lg text-2xl md:text-3xl text-white font-bold tracking-tight">
              The 6-Step Launch Process
            </h2>
            <div className="h-[1px] bg-white/10 flex-1"></div>
          </div>
        </Reveal>

        <div className="relative">
          {/* connecting rail */}
          <div className="absolute left-6 md:left-1/2 top-2 bottom-2 w-px md:-translate-x-1/2 bg-gradient-to-b from-primary/50 via-purple-500/40 to-primary/10" />

          <div className="space-y-10 md:space-y-6">
            {steps.map((step, idx) => (
              <Reveal key={idx} delay={idx * 90}>
                <div
                  className={`relative flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-0 ${
                    idx % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* marker */}
                  <div className="absolute left-6 -translate-x-1/2 md:left-1/2 top-6 md:top-1/2 md:-translate-y-1/2 z-10">
                    <div className="relative w-11 h-11 rounded-full bg-[#0c0e14] border-2 border-primary/40 flex items-center justify-center">
                      {step.badge && (
                        <span className="absolute -inset-1.5 rounded-full border border-red-400/40 animate-ping" />
                      )}
                      <span className="material-symbols-outlined text-[18px] text-primary">{step.icon}</span>
                    </div>
                  </div>

                  {/* spacer for desktop alternating layout */}
                  <div className="hidden md:block md:w-1/2" />

                  {/* card */}
                  <div className="w-full md:w-1/2 pl-16 md:pl-0">
                    <div
                      className={`glass-card rounded-[2rem] p-6 border-white/5 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${
                        idx % 2 === 1 ? 'md:mr-10' : 'md:ml-10'
                      }`}
                    >
                      {step.badge && (
                        <span className="inline-flex items-center gap-1.5 absolute top-6 right-6 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-label-mono font-bold tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                          {step.badge}
                        </span>
                      )}

                      <span className="font-label-mono text-caption text-primary/70 tracking-wider">
                        STEP {step.num}
                      </span>
                      <h3 className="text-[18px] font-bold text-white mt-1 mb-2">{step.title}</h3>
                      <p className="text-on-surface-variant text-[13px] leading-relaxed mb-4">{step.tagline}</p>

                      {step.chips && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {step.chips.map((chip, i) => (
                            <Chip key={i}>{chip}</Chip>
                          ))}
                        </div>
                      )}

                      {step.items.length > 0 && (
                        <ul className="space-y-2 mb-4">
                          {step.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-center gap-2.5 text-caption text-white">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {step.note && (
                        <div className="border-t border-white/5 pt-3 mt-1">
                          <span className="text-[11px] font-label-mono text-on-surface-variant/70 italic">
                            {step.note}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Split section: Premium features vs. Transparency commitment */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">

        <Reveal>
          <div className="glass-card rounded-[2.5rem] p-8 md:p-10 border-purple-500/20 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-[0_0_30px_rgba(139,92,246,0.05)] h-full">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <span className="font-label-mono text-[11px] text-purple-400 tracking-wider uppercase block mb-3 font-bold">
                // TIER UPGRADE
              </span>
              <h3 className="font-display-lg text-2xl md:text-3xl text-white font-bold mb-4">Premium Membership</h3>
              <p className="text-on-surface-variant text-[14px] leading-relaxed mb-8">
                Unlock advanced telemetry features and detailed analytics reports designed for serious traders.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Early launch information',
                  'Advanced project research',
                  'AI-powered market insights',
                  'Wallet analytics',
                  'Smart money tracking',
                  'Premium community access',
                  'Advanced notifications',
                  'Exclusive reports',
                ].map((label, i) => (
                  <div key={i} className="flex items-center gap-3 text-caption text-white font-label-mono">
                    <span className="material-symbols-outlined text-[16px] text-purple-400">stars</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="glass-card rounded-[2.5rem] p-8 md:p-10 border-white/5 flex flex-col justify-between hover:border-white/10 transition-all duration-300 h-full">
            <div>
              <span className="font-label-mono text-[11px] text-primary tracking-wider uppercase block mb-3 font-bold">
                // DATA CONVICTION
              </span>
              <h3 className="font-display-lg text-2xl md:text-3xl text-white font-bold mb-4">Transparency First</h3>
              <p className="text-on-surface-variant text-[14px] leading-relaxed mb-8">
                Every single launch is permanently recorded on the blockchain and listed inside our public
                dashboard. We believe trust is built through transparent data reporting.
              </p>

              <div className="space-y-3.5">
                {['Previous launches log', 'Historical performance audits', 'Community consensus ratings', 'Full audit reports'].map(
                  (label, i) => (
                    <div key={i} className="flex items-center gap-3 text-caption text-white font-label-mono">
                      <span className="material-symbols-outlined text-[18px] text-green-400">check_circle</span>
                      {label}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </Reveal>

      </section>

      {/* Accordion FAQ section */}
      <section className="max-w-4xl mx-auto mb-24">
        <Reveal>
          <h2 className="font-display-lg text-white mb-10 text-3xl font-bold tracking-tight text-center">
            Frequently Asked Questions
          </h2>
        </Reveal>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <Reveal key={idx} delay={idx * 60}>
                <div className="glass-card rounded-2xl border-white/5 overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex justify-between items-center gap-4 p-6 text-[16px] font-bold text-white transition-colors hover:bg-white/5 outline-none"
                  >
                    <span className="flex items-center gap-4 text-left">
                      <span className="font-label-mono text-[11px] text-primary/60">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      {faq.q}
                    </span>
                    <span
                      className={`material-symbols-outlined shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-45 text-primary' : ''
                      }`}
                    >
                      add
                    </span>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-48 border-t border-white/5 opacity-100 p-6' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <p className="text-on-surface-variant text-[14px] leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* CTA Final Banner */}
      <Reveal>
        <section className="max-w-5xl mx-auto">
          <div className="glass-card rounded-[2.5rem] border-white/10 p-10 md:p-16 text-center relative overflow-hidden bg-gradient-to-r from-primary/10 to-purple-500/10">
            <div className="absolute inset-0 scanline-overlay opacity-10 pointer-events-none"></div>

            <h2 className="font-display-lg text-white mb-4 text-3xl md:text-4xl font-bold tracking-tight">
              Ready for the Next Launch?
            </h2>
            <p className="text-on-surface-variant max-w-xl mx-auto mb-10 text-[14px] leading-relaxed">
              Join thousands of community members preparing for the next fair launch. Connect your wallet to access
              the genesis whitelist.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => alert('Simulating free account registration!')}
                className="bg-white text-black hover:bg-neutral-200 active:scale-95 transition-all px-8 py-3.5 rounded-full font-label-mono font-bold text-xs"
              >
                Create Your Free Account
              </button>
              <button
                onClick={() => alert('Redirecting to subscription portal...')}
                className="bg-[#8b5cf6] text-white hover:bg-[#7c3aed] active:scale-95 transition-all px-8 py-3.5 rounded-full font-label-mono font-bold text-xs shadow-[0_4px_15px_rgba(139,92,246,0.25)]"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </section>
      </Reveal>

    </div>
  );
}