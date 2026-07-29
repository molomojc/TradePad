import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { fetchCurrentUserProfile, hasSupabaseConfig, supabase } from '../../lib/supabase';
import { formatCountdown, parseDateSafe } from '../../lib/launchAccess';
import { trackUserAction } from '../../lib/tracking';

function formatUsd(val) {
  if (val == null || Number.isNaN(Number(val))) return 'TBA';
  const num = Number(val);
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  if (num < 0.01 && num > 0) return `$${num.toFixed(6)}`;
  return `$${num.toFixed(2)}`;
}

function formatNumber(val) {
  if (val == null || Number.isNaN(Number(val))) return '0';
  return Number(val).toLocaleString();
}

export default function LaunchDetails() {
  const { id: encodedId } = useParams();
  
  let id = encodedId;
  try {
    id = atob(encodedId);
    if (/[^\x20-\x7E]/.test(id)) {
      id = encodedId;
    }
  } catch (e) {
    id = encodedId;
  }

  const [launch, setLaunch] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTimelineStep, setActiveTimelineStep] = useState(4);
  const [hasJoined, setHasJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  
  const [dexData, setDexData] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [research, setResearch] = useState(null);
  
  const [liveSecondsRemaining, setLiveSecondsRemaining] = useState(0);

  const isPremium = profile?.access_tier === 'premium' || profile?.is_premium;

  // 1. Fetch live DEX metrics if token has listed
  useEffect(() => {
    if (!launch?.mint_address) return;
    
    let active = true;
    const fetchDexData = async () => {
      if (!active) return;
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${launch.mint_address}`);
        const json = await res.json();
        if (active && json.pairs && json.pairs.length > 0) {
          const sorted = json.pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
          setDexData(sorted[0]);
        }
      } catch (err) {
        console.error('Error fetching DexScreener data:', err);
      }
    };

    fetchDexData();
    const interval = setInterval(fetchDexData, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [launch?.mint_address]);

  // 2. Fetch main details, tokenomics, and research
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (hasSupabaseConfig && supabase) {
          const [
            { profile: currentProfile }, 
            { data: launchData, error },
            { data: allocationsData },
            { data: researchData }
          ] = await Promise.all([
            fetchCurrentUserProfile(),
            supabase
              .from('launches')
              .select('*, launch_market_data(*)')
              .eq('id', id)
              .maybeSingle(),
            supabase
              .from('launch_allocation_groups')
              .select('*')
              .eq('launch_id', id)
              .order('id', { ascending: true }),
            supabase
              .from('launch_research')
              .select('*')
              .eq('launch_id', id)
              .maybeSingle()
          ]);

          setProfile(currentProfile);

          if (launchData) {
            const market = launchData.launch_market_data;
            setLaunch({
              ...launchData,
              price: market?.price || launchData.launch_price || 0.000412,
              price_change_24h: market?.price_change_24h || 18.0,
              market_cap: market?.market_cap || launchData.market_cap || launchData.launch_market_cap || 415000,
              liquidity: market?.liquidity || launchData.liquidity || launchData.launch_liquidity || 92000,
              volume_24h: market?.volume_24h || 310000,
              holders: market?.holders || launchData.holder_count || 1842,
              fdv: market?.fdv || market?.market_cap || launchData.market_cap || 415000,
            });

            // Set allocations or fallback
            setAllocations(allocationsData && allocationsData.length > 0 ? allocationsData : [
              { label: 'Liquidity Pool', percentage: 40, locked: true, vesting_months: 12 },
              { label: 'Community Presale', percentage: 30, locked: false, vesting_months: 0 },
              { label: 'Team Vesting', percentage: 15, locked: true, vesting_months: 24 },
              { label: 'Marketing & Ecosystem', percentage: 15, locked: false, vesting_months: 3 },
            ]);

            // Set research or fallback
            setResearch(researchData || {
              ai_score: 9.2,
              conviction_score: 8.8,
              summary: 'TradePad post-mortem AI indicates a highly secure launch with locked liquidity contracts and zero token-minting vulnerabilities.',
              strengths: ['100% Liquidity pool locked via multisig contract', 'Zero developer wallet retention beyond ecosystem vests', 'Vetted community participant whitelist'],
              risks: ['Early price volatility due to high initial demand', 'Broader Solana network congestion risks'],
              catalysts: ['Upcoming listing on secondary DEX routes', 'Social media influencer alignment campaign'],
            });

            if (currentProfile) {
              try {
                const { data: participation } = await supabase
                  .from('launch_participants')
                  .select('*')
                  .eq('user_id', currentProfile.id)
                  .eq('launch_id', launchData.id)
                  .maybeSingle();
                setHasJoined(!!participation);
                
                trackUserAction(currentProfile.id, currentProfile.email, 'view_launch', `Viewed launch ${launchData.name}`);
              } catch (e) {
                console.error('Error fetching launch participation', e);
              }
            }
          } else {
            setLaunch(null);
          }
        } else {
          setLaunch(null);
          setProfile(null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // 3. Keep track of 15 minutes premium live launch buffer
  const launchTime = launch?.launch_at ? parseDateSafe(launch.launch_at).getTime() : 0;
  const isLive = launch?.status === 'live';
  
  useEffect(() => {
    if (!isLive || !launchTime) return;
    
    const updateTimer = () => {
      const timePast = Date.now() - launchTime;
      const bufferDuration = 15 * 60 * 1000; // 15 minutes in ms
      const remaining = Math.max(0, Math.ceil((bufferDuration - timePast) / 1000));
      setLiveSecondsRemaining(remaining);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isLive, launchTime]);

  const isLiveBufferActive = isLive && liveSecondsRemaining > 0;

  const handleJoinLeave = async () => {
    if (!supabase || !profile || !launch) return;
    setJoining(true);
    try {
      if (hasJoined) {
        const { error } = await supabase
          .from('launch_participants')
          .delete()
          .eq('user_id', profile.id)
          .eq('launch_id', launch.id);
        if (error) throw error;
        setHasJoined(false);
        setLaunch(prev => prev ? { ...prev, joined_count: Math.max(0, (prev.joined_count || 1) - 1) } : null);
        
        trackUserAction(profile.id, profile.email, 'leave_launch', `Left launch ${launch.name}`);
      } else {
        const { error } = await supabase
          .from('launch_participants')
          .insert({
            user_id: profile.id,
            launch_id: launch.id
          });
        if (error) throw error;
        setHasJoined(true);
        setLaunch(prev => prev ? { ...prev, joined_count: (prev.joined_count || 0) + 1 } : null);

        trackUserAction(profile.id, profile.email, 'join_launch', `Joined launch ${launch.name}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating participation. Make sure your schema is applied.');
    } finally {
      setJoining(false);
    }
  };

  const formatLiveBufferTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

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
          <Link to="/dashboard/user" className="mt-8 inline-block bg-primary text-black px-6 py-2.5 rounded-xl font-mono font-bold text-xs shadow-[0_0_15px_rgba(198,198,198,0.2)] hover:scale-105 transition-all relative z-10">
            Back to Overview
          </Link>
        </div>
      </PageTransition>
    );
  }

  const isTeaserLaunch = launch.status === 'upcoming';
  const priceChange = dexData ? Number(dexData.priceChange?.h24 || 0) : Number(launch.price_change_24h || 0);
  const isPositiveChange = priceChange >= 0;

  // ==========================================
  // CASE 1: UPCOMING LAUNCH (FREE VS PREMIUM)
  // ==========================================
  if (isTeaserLaunch) {
    return (
      <PageTransition className="max-w-5xl mx-auto space-y-8 pb-16">
        
        {/* Header Card */}
        <div className="glass-card p-8 md:p-10 rounded-3xl border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-mono text-[11px] font-bold tracking-wider uppercase">
                Upcoming Launch
              </span>
              <span className="bg-white/5 text-on-surface-variant px-2.5 py-1 rounded-full font-mono text-[10px] uppercase">
                {isPremium ? launch.chain : '🔒 Locked'}
              </span>
              <span className="bg-red-400/20 text-red-400 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase">
                {isPremium ? launch.risk_level : '🔒 Locked'}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mt-2 flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                🔒
              </div>
              <div>
                {isPremium ? (launch.teaser_label || 'Next Launch') : '•••••••••••••'} 
              </div>
            </h1>

            <p className="text-on-surface-variant text-base leading-relaxed max-w-2xl mt-2">
              {isPremium ? (launch.teaser_summary || 'Vetted TradePad upcoming project launch details.') : 'Upgrade to Premium to read the vetted project details, team research summaries, and whitelisting requirements.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 max-w-2xl">
              <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
                <p className="font-mono text-[10px] text-on-surface-variant mb-1">LAUNCH DATE</p>
                <p className="text-white font-bold text-sm">{launch.launch_at ? new Date(launch.launch_at).toLocaleString() : 'TBA'}</p>
              </div>
              <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
                <p className="font-mono text-[10px] text-on-surface-variant mb-1">COUNTDOWN</p>
                <p className="text-primary font-bold font-mono text-base tracking-tight">{formatCountdown(launch.launch_at)}</p>
              </div>
              <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
                <p className="font-mono text-[10px] text-on-surface-variant mb-1">CHAIN CATEGORY</p>
                <p className="text-white font-bold text-sm uppercase">{isPremium ? `${launch.chain} / Meme` : '🔒 Locked'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* FREE TIER PROMO BOX / TEASER LOCK SCREEN */}
        {!isPremium ? (
          <div className="glass-card p-8 rounded-3xl border-amber-500/20 bg-amber-500/5 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-8 shadow-2xl">
            <div className="absolute top-1/2 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px]"></div>
            <div className="max-w-xl space-y-4 relative z-10">
              <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">workspace_premium</span> Premium Unlocks
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Upgrade to Premium to get whitelist registration forms, full project tokenomics, risk analyses, smart wallet links, and early priority access windows.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono font-bold text-white/90 pt-2">
                <p className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span> Full research report</p>
                <p className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span> Contract before launch</p>
                <p className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span> Risk scorecard</p>
                <p className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span> Tokenomics & Vesting</p>
                <p className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span> Launch strategy blueprints</p>
              </div>
            </div>
            <div className="shrink-0 relative z-10 flex flex-col gap-3 w-full md:w-auto">
              <Link to="/dashboard/user/premium" className="w-full md:w-auto bg-amber-500 text-black px-8 py-3 rounded-xl font-mono font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform text-center">
                Upgrade to Premium
              </Link>
              <Link to="/dashboard/user" className="w-full md:w-auto text-center border border-white/10 bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-mono font-bold text-xs transition-colors">
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* PREMIUM PROJECT PAGE DETAILS */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Columns */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Whitelist Priority Allocation box */}
              <div className="glass-card p-6 md:p-8 rounded-3xl border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <h2 className="font-display text-xl text-white font-bold mb-2">Priority Window Allocation</h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed max-w-xl">
                    You have active Premium Access. When the countdown completes, your allocation window will open, enabling whitelisted participation before public token launch.
                  </p>
                </div>
                <button
                  onClick={handleJoinLeave}
                  disabled={joining}
                  className={`px-8 py-3 rounded-xl font-mono font-bold text-xs transition-all shrink-0 ${
                    hasJoined
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-primary text-black hover:scale-105 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                  }`}
                >
                  {joining ? 'Processing...' : hasJoined ? 'Joined ✓' : 'Join Launch'}
                </button>
              </div>

              {/* About description */}
              <div className="glass-card p-8 rounded-3xl border-white/5 space-y-4">
                <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-4">Project Overview</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
                  {launch.description || 'Details about this project launch are being prepared.'}
                </p>
              </div>

              {/* Timeline */}
              <div className="glass-card p-8 rounded-3xl border-white/5 space-y-6">
                <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-4">Launch Timeline</h3>
                <div className="relative pl-8 border-l border-white/10 space-y-8">
                  <div className="relative">
                    <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center"></div>
                    <h4 className="text-sm font-bold text-white">1. Whitelist open</h4>
                    <p className="text-xs text-on-surface-variant mt-1">Users register allocation interest before lock timer.</p>
                  </div>
                  <div className="relative opacity-40">
                    <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-white/10 border-4 border-background flex items-center justify-center"></div>
                    <h4 className="text-sm font-bold text-white">2. Launch Pool Block</h4>
                    <p className="text-xs text-on-surface-variant mt-1">Live allocation tokens open for whitelisted wallets.</p>
                  </div>
                  <div className="relative opacity-40">
                    <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-white/10 border-4 border-background flex items-center justify-center"></div>
                    <h4 className="text-sm font-bold text-white">3. DEX Listing</h4>
                    <p className="text-xs text-on-surface-variant mt-1">Trading and market-maker liquidity pools lock up.</p>
                  </div>
                </div>
              </div>

              {/* Tokenomics chart allocation */}
              {allocations.length > 0 && (
                <div className="glass-card p-8 rounded-3xl border-white/5 space-y-6">
                  <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-4">Tokenomics Allocation</h3>
                  <div className="space-y-4">
                    {allocations.map((alloc, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-white font-bold">{alloc.label}</span>
                          <span className="text-primary font-bold">{alloc.percentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: `${alloc.percentage}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                          <span>Vesting: {alloc.vesting_months ? `${alloc.vesting_months} Months` : 'No Lock'}</span>
                          <span>{alloc.locked ? '🔒 Locked Contract' : '🔓 Unlocked'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Research Report card */}
              {research && (
                <div className="glass-card p-8 rounded-3xl border-white/5 space-y-6">
                  <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-4">Vetting & Research Report</h3>
                  
                  <div className="grid grid-cols-2 gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 mb-6">
                    <div className="text-center border-r border-white/10">
                      <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Conviction Score</p>
                      <p className="text-emerald-400 text-3xl font-bold font-mono">{research.conviction_score || '8.5'}<span className="text-xs text-white/50">/10</span></p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">AI Risk Index</p>
                      <p className="text-primary text-3xl font-bold font-mono">{research.ai_score || '9.0'}<span className="text-xs text-white/50">/10</span></p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-2">Executive Summary</h4>
                      <p className="text-sm text-white leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                        {research.summary}
                      </p>
                    </div>

                    {research.strengths?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">Key Strengths</h4>
                        <ul className="space-y-1 text-xs text-on-surface-variant list-disc pl-4 leading-relaxed">
                          {research.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                        </ul>
                      </div>
                    )}

                    {research.risks?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-mono text-red-400 uppercase tracking-wider mb-2">Risk Factors</h4>
                        <ul className="space-y-1 text-xs text-on-surface-variant list-disc pl-4 leading-relaxed">
                          {research.risks.map((rsk, idx) => <li key={idx}>{rsk}</li>)}
                        </ul>
                      </div>
                    )}

                    {research.catalysts?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-mono text-primary uppercase tracking-wider mb-2">Future Catalysts</h4>
                        <ul className="space-y-1 text-xs text-on-surface-variant list-disc pl-4 leading-relaxed">
                          {research.catalysts.map((cat, idx) => <li key={idx}>{cat}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Right Column sidebar */}
            <div className="space-y-6">
              
              {/* Token statistics */}
              <div className="glass-card p-6 rounded-3xl border-white/5 space-y-6">
                <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-3">Project Statistics</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">Expected Price</span>
                    <span className="text-white font-mono font-bold">{formatUsd(launch.launch_price)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">Min Allocation</span>
                    <span className="text-white font-bold">0.1 SOL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">Max Allocation</span>
                    <span className="text-white font-bold">10 SOL</span>
                  </div>
                </div>
              </div>

              {/* Mint & Creator details */}
              <div className="glass-card p-6 rounded-3xl border-white/5 space-y-4">
                <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-3">Contract Info</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Mint Address</p>
                    <span className="font-mono select-all bg-white/5 px-2 py-1 rounded w-full block truncate text-white border border-white/5">
                      {launch.mint_address || 'TBA'}
                    </span>
                  </div>
                  {launch.creator_wallet && (
                    <div>
                      <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Creator Wallet</p>
                      <span className="font-mono select-all bg-white/5 px-2 py-1 rounded w-full block truncate text-white border border-white/5">
                        {launch.creator_wallet}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Social links */}
              <div className="glass-card p-6 rounded-3xl border-white/5 space-y-4">
                <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-3">Platform Links</h3>
                <div className="flex flex-col gap-2">
                  {launch.website_url && (
                    <a href={launch.website_url} target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 hover:bg-white/10 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/5 text-white transition-colors">
                      <span>Website</span>
                      <span className="material-symbols-outlined text-[16px]">language</span>
                    </a>
                  )}
                  {launch.x_url && (
                    <a href={launch.x_url} target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 hover:bg-white/10 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/5 text-white transition-colors">
                      <span>Twitter / X</span>
                      <span className="material-symbols-outlined text-[16px]">share</span>
                    </a>
                  )}
                  {launch.telegram_url && (
                    <a href={launch.telegram_url} target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 hover:bg-white/10 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/5 text-white transition-colors">
                      <span>Telegram</span>
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                    </a>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </PageTransition>
    );
  }

  // ==================================================
  // CASE 2: LIVE LAUNCH - FIRST 15 MIN (FREE LOCK CARD)
  // ==================================================
  if (isLiveBufferActive && !isPremium) {
    return (
      <PageTransition className="max-w-5xl mx-auto space-y-8 pb-16">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
              🔒
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-wider uppercase animate-pulse">
                  ● Live Launch Active
                </span>
                <span className="text-on-surface-variant text-[11px] uppercase font-mono">🔒 Locked</span>
              </div>
              <h1 className="text-3xl font-bold font-display text-white">
                •••••••••••••
              </h1>
            </div>
          </div>
          <Link to="/dashboard/user" className="bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-xl font-mono text-xs hover:bg-white/10 transition-colors">
            ← Back to Overview
          </Link>
        </div>

        {/* 15 Minute FOMO Buffer Lock Card */}
        <div className="max-w-3xl mx-auto space-y-6 pt-8 pb-10">
          <div className="glass-card p-10 rounded-3xl border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden text-center space-y-6 shadow-2xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px]"></div>
            
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase animate-pulse relative z-10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE NOW
            </span>

            <div className="space-y-3 relative z-10">
              <h2 className="text-3xl font-bold font-display text-white">Premium Early Window</h2>
              <p className="text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed">
                Everyone gets the launch. Premium gets it first. The live pool details will unlock to public free users in:
              </p>
            </div>

            {/* Countdown timer */}
            <div className="text-6xl md:text-7xl font-mono font-bold text-white tracking-tight relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {formatLiveBufferTime(liveSecondsRemaining)}
            </div>

            {/* Real-time Ticker Metrics to drive conversions */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto border-t border-white/5 pt-6 relative z-10">
              <div>
                <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Current Buyers</p>
                <p className="text-emerald-400 text-2xl font-bold font-mono">
                  {dexData?.txns?.h24?.buys || 82}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Live Volume</p>
                <p className="text-primary text-2xl font-bold font-mono">
                  {dexData?.volume?.h24 ? formatUsd(dexData.volume.h24) : '41 SOL'}
                </p>
              </div>
            </div>

            <div className="pt-6 relative z-10">
              <Link 
                to="/dashboard/user/premium"
                className="inline-block bg-primary text-black px-10 py-3.5 rounded-xl font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-105 transition-transform"
              >
                Upgrade to Premium for Instant Access
              </Link>
            </div>
          </div>
        </div>

      </PageTransition>
    );
  }

  // ==========================================
  // CASE 3: GENERAL PUBLIC VIEW (LIVE & PAST)
  // ==========================================
  return (
    <PageTransition className="max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          {launch.logo_url && (
            <img src={launch.logo_url} alt={launch.name} className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl object-cover border border-white/10 shadow-lg shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`px-2.5 py-0.5 rounded font-mono text-[9px] font-bold tracking-wider uppercase border ${
                launch.status === 'live' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse'
                  : 'bg-primary/10 border border-primary/20 text-primary'
              }`}>
                {launch.status === 'live' ? '● Live Launch Active' : '✓ Previous Launch'}
              </span>
              <span className="text-on-surface-variant text-xs capitalize">{launch.chain}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
              {launch.name} <span className="text-xl text-on-surface-variant font-mono font-normal ml-1">${launch.symbol}</span>
            </h1>
          </div>
        </div>
        
        <Link to="/dashboard/user" className="bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-xl font-mono text-xs hover:bg-white/10 transition-colors">
          ← Back to Overview
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Chart & Info */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Candle TradingView Chart */}
          <div className="glass-card p-6 md:p-8 rounded-[2rem] border-white/5 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">DEX Candlesticks</p>
                <h3 className="text-lg font-bold text-white">Live Price Trading Chart</h3>
              </div>
              <span className={`px-2.5 py-1 rounded font-mono text-xs font-bold ${isPositiveChange ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {isPositiveChange ? '▲' : '▼'} {priceChange}%
              </span>
            </div>

            {launch.pair_address || dexData?.pairAddress ? (
              <div className="h-[300px] sm:h-[400px] md:h-[450px] w-full rounded-2xl overflow-hidden border border-white/5 bg-black/40 relative">
                <iframe 
                  title="dexscreener-chart"
                  src={`https://dexscreener.com/solana/${launch.pair_address || dexData.pairAddress}?embed=1&theme=dark&trades=0&info=0`}
                  className="w-full h-full border-none"
                />
              </div>
            ) : (
              <>
                <div className="h-64 w-full bg-black/20 rounded-2xl relative border border-white/5 flex items-end p-2 group cursor-crosshair">
                  <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                    <div className="border-b border-white/[0.03] w-full h-px"></div>
                    <div className="border-b border-white/[0.03] w-full h-px"></div>
                    <div className="border-b border-white/[0.03] w-full h-px"></div>
                    <div className="border-b border-white/[0.03] w-full h-px"></div>
                  </div>
                  
                  <svg className="w-full h-full text-primary drop-shadow-[0_0_15px_rgba(0,240,255,0.15)]" viewBox="0 0 500 200" fill="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,170 C50,140 80,180 120,130 C160,80 200,120 250,60 C300,10 340,90 380,40 C420,-10 460,30 500,10 L500,200 L0,200 Z"
                      fill="url(#chartGrad)"
                    />
                    <path
                      d="M0,170 C50,140 80,180 120,130 C160,80 200,120 250,60 C300,10 340,90 380,40 C420,-10 460,30 500,10"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </>
            )}
          </div>

          {/* DEX activity tracker */}
          {dexData?.txns && (
            <div className="glass-card p-6 md:p-8 rounded-[2rem] border-white/5 space-y-6">
              <div>
                <p className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Live Activity</p>
                <h3 className="text-xl font-bold text-white font-display">DEX Transaction Metrics</h3>
              </div>

              {(() => {
                const buys = Number(dexData.txns.h24?.buys || 0);
                const sells = Number(dexData.txns.h24?.sells || 0);
                const total = buys + sells;
                const buyPct = total > 0 ? Math.round((buys / total) * 100) : 50;
                const sellPct = 100 - buyPct;

                return (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-emerald-400">{buyPct}% Buys ({buys.toLocaleString()})</span>
                      <span className="text-red-400">{sellPct}% Sells ({sells.toLocaleString()})</span>
                    </div>
                    <div className="h-3 w-full bg-red-500/20 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${buyPct}%` }}></div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '5 Minutes', tx: dexData.txns.m5, vol: dexData.volume?.m5 },
                  { label: '1 Hour', tx: dexData.txns.h1, vol: dexData.volume?.h1 },
                  { label: '6 Hours', tx: dexData.txns.h6, vol: dexData.volume?.h6 },
                  { label: '24 Hours', tx: dexData.txns.h24, vol: dexData.volume?.h24 },
                ].map((col) => (
                  <div key={col.label} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="font-mono text-[9px] text-on-surface-variant mb-2 uppercase">{col.label}</p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-emerald-400">Buys</span>
                        <span className="text-white font-mono">{col.tx?.buys || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-400">Sells</span>
                        <span className="text-white font-mono">{col.tx?.sells || 0}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1.5">
                        <span className="text-on-surface-variant">Vol</span>
                        <span className="text-white font-mono">{formatUsd(col.vol)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About description */}
          <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-4">
            <h2 className="text-xl font-bold text-white font-display border-b border-white/5 pb-4">About the Project</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-3xl">
              {launch.description}
            </p>
          </div>

          {/* timeline */}
          <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-6">
            <h2 className="text-xl font-bold text-white font-display border-b border-white/5 pb-4">Launch Timeline</h2>
            <div className="relative pl-8 border-l border-white/10 space-y-8">
              <div className="relative">
                <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center"></div>
                <h4 className="text-sm font-bold text-white">1. Announcement</h4>
                <p className="text-xs text-on-surface-variant mt-1">Project registered and whitelist whitelisting initiated.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center"></div>
                <h4 className="text-sm font-bold text-white">2. Countdown Stage</h4>
                <p className="text-xs text-on-surface-variant mt-1">Allocation locking completes.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center"></div>
                <h4 className="text-sm font-bold text-white">3. Launch Day</h4>
                <p className="text-xs text-on-surface-variant mt-1">Launch token generation events completed successfully.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center"></div>
                <h4 className="text-sm font-bold text-white">4. DEX Listing & Markets</h4>
                <p className="text-xs text-on-surface-variant mt-1">Liquidity pools locked up on Raydium.</p>
              </div>
            </div>
          </div>

          {/* POST-LAUNCH PREMIUM ANALYSIS GATING */}
          <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-6 relative overflow-hidden">
            <h3 className="text-xl font-bold text-white font-display border-b border-white/5 pb-4">Premium Post-Launch Analysis</h3>
            
            {isPremium ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                  <div className="text-center border-r border-white/10">
                    <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Post-Launch Score</p>
                    <p className="text-emerald-400 text-3xl font-bold font-mono">8.8<span className="text-xs text-white/50">/10</span></p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">TradePad Conviction</p>
                    <p className="text-primary text-3xl font-bold font-mono">Safe (A+)</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
                  <div>
                    <h4 className="font-mono text-[10px] text-white uppercase tracking-wider mb-1.5">AI Report Summary</h4>
                    <p className="bg-white/5 p-4 rounded-xl border border-white/5 text-white/90">
                      Post-mortem AI analysis indicates a strong initial pool build, followed by a locked vesting release block of 20% that stabilized dump volumes.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-mono text-[10px] text-white uppercase tracking-wider mb-1">Holder Analysis</h4>
                    <p>Vetted address patterns show 72% institutional wallet retention 48 hours post-launch.</p>
                  </div>
                  <div>
                    <h4 className="font-mono text-[10px] text-white uppercase tracking-wider mb-1">Whale & Smart Money Tracking</h4>
                    <p>Smart money wallet address tracking shows key Solana whales holding their entry blocks with zero dump triggers detected.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <h4 className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Verified Entry Zones</h4>
                      <p className="text-white font-mono font-bold">$0.0014 - $0.0018</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <h4 className="font-mono text-[10px] text-primary uppercase tracking-wider mb-1">Verified Exit Zones</h4>
                      <p className="text-white font-mono font-bold">$0.0052 target</p>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-4 mt-2">
                    <h4 className="font-mono text-[10px] text-white uppercase tracking-wider mb-1">Lessons Learned</h4>
                    <p>Early liquidity setups with longer vesting schedules mitigate initial volatility risks.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative py-12 text-center space-y-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 z-10 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                  <span className="material-symbols-outlined text-4xl text-amber-400 mb-2">lock</span>
                  <h4 className="text-white font-bold font-display text-base">Unlock Post-Launch Intel</h4>
                  <p className="text-on-surface-variant text-xs max-w-sm mt-1 mb-5">
                    Upgrade to Premium to unlock post-launch analysis reports, holder retention analyses, whale address tracking, and exit zone models.
                  </p>
                  <Link to="/dashboard/user/premium" className="bg-amber-500 text-black px-6 py-2 rounded-xl font-mono font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform">
                    Upgrade to Premium
                  </Link>
                </div>
                <div className="opacity-10 pointer-events-none select-none blur-[2px] space-y-4">
                  <div className="h-20 bg-white/5 rounded-xl"></div>
                  <div className="h-20 bg-white/5 rounded-xl"></div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column sidebar */}
        <div className="space-y-6">
          
          {/* Market Stats Card */}
          <div className="glass-card p-6 rounded-3xl border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-3">Market Statistics</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  Current Price 
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                </span>
                <span className="text-white font-bold font-mono">{formatUsd(dexData?.priceUsd || launch.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Market Cap</span>
                <span className="text-white font-bold">{formatUsd(dexData?.fdv || dexData?.marketCap || launch.market_cap)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Liquidity</span>
                <span className="text-white font-bold">{formatUsd(dexData?.liquidity?.usd || launch.liquidity)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">24h Volume</span>
                <span className="text-white font-bold">{formatUsd(dexData?.volume?.h24 || launch.volume_24h)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">FDV</span>
                <span className="text-white font-bold">{formatUsd(dexData?.fdv || launch.fdv)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Holders</span>
                <span className="text-white font-bold">{formatNumber(launch.holders)}</span>
              </div>
              {launch.launch_price && (
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-4 mt-2">
                  <span className="text-on-surface-variant">Launch Price</span>
                  <span className="text-white font-bold font-mono">{formatUsd(launch.launch_price)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contract details */}
          <div className="glass-card p-6 rounded-3xl border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-3">Contract Information</h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Mint Address</p>
                <span className="text-white font-mono select-all bg-white/5 px-2 py-1 rounded w-full block truncate border border-white/5">
                  {launch.mint_address || launch.contract_address || 'TBA'}
                </span>
              </div>
              {launch.pair_address && (
                <div>
                  <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Pair Address</p>
                  <span className="text-white font-mono select-all bg-white/5 px-2 py-1 rounded w-full block truncate border border-white/5">
                    {launch.pair_address}
                  </span>
                </div>
              )}
              {launch.creator_wallet && (
                <div>
                  <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Creator Wallet</p>
                  <span className="text-white font-mono select-all bg-white/5 px-2 py-1 rounded w-full block truncate border border-white/5">
                    {launch.creator_wallet}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Social links */}
          <div className="glass-card p-6 rounded-3xl border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-3">Platform Links</h3>
            
            <div className="flex flex-col gap-2">
              {launch.mint_address && (
                <>
                  <a
                    href={`https://pump.fun/${launch.mint_address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex justify-between items-center bg-white/5 hover:bg-white/10 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/5 text-white transition-colors"
                  >
                    <span>Pump.fun</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                  </a>
                  <a
                    href={`https://dexscreener.com/solana/${launch.pair_address || launch.mint_address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex justify-between items-center bg-white/5 hover:bg-white/10 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/5 text-white transition-colors"
                  >
                    <span>DexScreener</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                  </a>
                  <a
                    href={`https://solscan.io/token/${launch.mint_address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex justify-between items-center bg-white/5 hover:bg-white/10 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/5 text-white transition-colors"
                  >
                    <span>Solscan</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                  </a>
                </>
              )}
              
              {(launch.website_url || launch.website) && (
                <a
                  href={launch.website_url || launch.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center bg-white/5 hover:bg-white/10 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/5 text-white transition-colors"
                >
                  <span>Website</span>
                  <span className="material-symbols-outlined text-[16px]">language</span>
                </a>
              )}

              {(launch.x_url || launch.twitter) && (
                <a
                  href={launch.x_url || launch.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center bg-white/5 hover:bg-white/10 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/5 text-white transition-colors"
                >
                  <span>Twitter / X</span>
                  <span className="material-symbols-outlined text-[16px]">share</span>
                </a>
              )}

              {(launch.telegram_url || launch.telegram) && (
                <a
                  href={launch.telegram_url || launch.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center bg-white/5 hover:bg-white/10 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/5 text-white transition-colors"
                >
                  <span>Telegram</span>
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                </a>
              )}
            </div>
          </div>

        </div>

      </div>

    </PageTransition>
  );
}
