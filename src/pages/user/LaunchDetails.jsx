import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { fetchCurrentUserProfile, hasSupabaseConfig, supabase } from '../../lib/supabase';
import { fetchLaunches, formatCountdown } from '../../lib/launchAccess';

export default function LaunchDetails() {
  const { id } = useParams();
  const [launch, setLaunch] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isPremium = profile?.access_tier === 'premium' || profile?.is_premium;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (hasSupabaseConfig && supabase) {
        const [{ profile: currentProfile }, { data }] = await Promise.all([
          fetchCurrentUserProfile(),
          fetchLaunches({ status: 'upcoming' }),
        ]);
        setProfile(currentProfile);
        setLaunch(data?.find((item) => item.id === id) || data?.[0] || null);
      } else {
        setProfile({ access_tier: 'premium', is_premium: true });
        setLaunch({
          id,
          name: 'Hidden Wave',
          chain: 'solana',
          status: 'upcoming',
          risk_level: 'medium',
          description: 'A hidden premium launch with delayed public disclosure.',
          launch_at: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
          joined_count: 284,
          teaser_summary: 'Join the next launch before the project details are revealed.',
          overview_paragraphs: ['Details are intentionally hidden.', 'Premium members receive the blind launch card first.'],
          tokenomics: { total_supply: 'Hidden', liquidity: 0, team: 0, marketing: 0 },
          roadmap: [],
          team: { name: 'Hidden', role: 'Undisclosed' },
          premium: { ai_score: 82, strengths: ['Early access'], risks: ['Information lock'] },
        });
      }
      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </PageTransition>
    );
  }

  if (!launch) {
    return (
      <PageTransition className="max-w-3xl mx-auto space-y-8 pb-10 pt-10">
        <div className="text-center py-24 glass-card rounded-3xl border-red-500/10 bg-gradient-to-b from-red-500/5 to-transparent relative overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]"></div>
          <span className="material-symbols-outlined text-6xl mb-4 text-red-500/30 relative z-10 animate-pulse">explore_off</span>
          <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Launch Not Found</h3>
          <p className="text-on-surface-variant relative z-10 max-w-sm mx-auto">This launch may have been removed or is not ready yet.</p>
          <Link to="/dashboard/user/upcoming" className="mt-8 inline-block bg-primary text-black px-6 py-2.5 rounded-xl font-label-mono font-bold text-xs shadow-[0_0_15px_rgba(198,198,198,0.2)] hover:scale-105 transition-all relative z-10">
            Back to Launches
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="glass-card p-8 md:p-10 rounded-3xl border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-label-mono text-[11px] font-bold tracking-wider">
              {isPremium ? 'NEXT LAUNCH' : 'ARCHIVE'}
            </span>
            <span className="bg-white/5 text-on-surface-variant px-2.5 py-1 rounded-full font-label-mono text-[10px]">{launch.chain}</span>
            <span className="bg-red-400/20 text-red-400 px-2.5 py-1 rounded-full font-label-mono text-[10px]">{launch.risk_level}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-display-lg font-bold text-white">
            {isPremium ? 'Join the Next Launch' : launch.name}
          </h1>
          <p className="text-on-surface-variant text-base leading-relaxed max-w-2xl">
            {isPremium ? launch.teaser_summary || 'The project stays hidden until launch time.' : launch.description}
          </p>

          <div className="flex flex-wrap gap-4">
            <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
              <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">LAUNCH DATE</p>
              <p className="text-white font-bold">{launch.launch_at ? new Date(launch.launch_at).toLocaleString() : 'TBA'}</p>
            </div>
            <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
              <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">COUNTDOWN</p>
              <p className="text-primary font-bold font-label-mono text-lg tracking-tight">{formatCountdown(launch.launch_at)}</p>
            </div>
            <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
              <p className="font-label-mono text-[10px] text-on-surface-variant mb-1">JOINED</p>
              <p className="text-white font-bold">{launch.joined_count ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 rounded-3xl border-white/5">
        <h2 className="font-headline-md text-2xl text-white font-bold mb-4">Access</h2>
        <p className="text-on-surface-variant leading-relaxed max-w-3xl">
          {isPremium
            ? 'This launch is intentionally masked. Premium members can see the next launch, timer, and join count, but not the coin identity until the reveal stage.'
            : 'Free members can browse the public archive only. Upgrade to premium to access the next-launch card.'}
        </p>
        <div className="mt-6">
          <Link to={isPremium ? '/dashboard/user/upcoming' : '/dashboard/user/premium'} className="inline-flex bg-primary text-black px-6 py-2.5 rounded-xl font-label-mono font-bold text-xs">
            {isPremium ? 'Back to Launches' : 'Upgrade to Premium'}
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
