import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { fetchCurrentUserProfile, hasSupabaseConfig, supabase } from '../../lib/supabase';
import { formatCountdown } from '../../lib/launchAccess';
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
  const { id } = useParams();
  const [launch, setLaunch] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTimelineStep, setActiveTimelineStep] = useState(4); // Default to DEX step for archive
  const [hasJoined, setHasJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  
  const [dexData, setDexData] = useState(null);
  const [dexLoading, setDexLoading] = useState(false);

  const isPremium = profile?.access_tier === 'premium' || profile?.is_premium;

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (hasSupabaseConfig && supabase) {
          const [{ profile: currentProfile }, { data: launchData, error }] = await Promise.all([
            fetchCurrentUserProfile(),
            supabase
              .from('launches')
              .select('*, launch_market_data(*)')
              .eq('id', id)
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

            if (currentProfile) {
              try {
                const { data: participation } = await supabase
                  .from('launch_participants')
                  .select('*')
                  .eq('user_id', currentProfile.id)
                  .eq('launch_id', launchData.id)
                  .maybeSingle();
                setHasJoined(!!participation);
                
                // Track page view action
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
        
        // Track leave action
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

        // Track join action
        trackUserAction(profile.id, profile.email, 'join_launch', `Joined launch ${launch.name}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating participation. Make sure your schema is applied.');
    } finally {
      setJoining(false);
    }
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
          <Link to="/dashboard/user/previous" className="mt-8 inline-block bg-primary text-black px-6 py-2.5 rounded-xl font-mono font-bold text-xs shadow-[0_0_15px_rgba(198,198,198,0.2)] hover:scale-105 transition-all relative z-10">
            Back to Launches
          </Link>
        </div>
      </PageTransition>
    );
  }

  // Determine if this is an upcoming teaser launch card
  const isTeaserLaunch = launch.status === 'upcoming';
  const showTeaserGate = isTeaserLaunch && !isPremium;

  if (showTeaserGate) {
    return (
      <PageTransition className="max-w-3xl mx-auto space-y-8 pb-10 pt-10">
        <div className="text-center py-24 glass-card rounded-3xl border-white/5 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 relative z-10">
            <span className="material-symbols-outlined text-3xl text-primary drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">lock</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 relative z-10 font-display">Unlock Upcoming Launch details</h3>
          <p className="text-on-surface-variant relative z-10 max-w-sm mx-auto leading-relaxed">Upgrade to Premium to view project stats, live countdowns, and reserved allocation access.</p>
          <Link to="/dashboard/user/premium" className="mt-8 inline-block bg-primary text-black px-8 py-3 rounded-xl font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition-all relative z-10">
            Upgrade to Premium
          </Link>
        </div>
      </PageTransition>
    );
  }

  // Upcoming Premium view
  if (isTeaserLaunch) {
    return (
      <PageTransition className="max-w-5xl mx-auto space-y-8 pb-10">
        <div className="glass-card p-8 md:p-10 rounded-3xl border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-mono text-[11px] font-bold tracking-wider uppercase">
                Upcoming Launch
              </span>
              <span className="bg-white/5 text-on-surface-variant px-2.5 py-1 rounded-full font-mono text-[10px] uppercase">{launch.chain}</span>
              <span className="bg-red-400/20 text-red-400 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase">{launch.risk_level}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mt-2">
              {launch.name}
            </h1>
            <p className="text-on-surface-variant text-base leading-relaxed max-w-2xl">
              {launch.description || launch.teaser_summary || 'Vetted TradePad upcoming project launch details.'}
            </p>

            <div className="flex flex-wrap gap-4 mt-4">
              <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
                <p className="font-mono text-[10px] text-on-surface-variant mb-1">LAUNCH DATE</p>
                <p className="text-white font-bold">{launch.launch_at ? new Date(launch.launch_at).toLocaleString() : 'TBA'}</p>
              </div>
              <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
                <p className="font-mono text-[10px] text-on-surface-variant mb-1">COUNTDOWN</p>
                <p className="text-primary font-bold font-mono text-lg tracking-tight">{formatCountdown(launch.launch_at)}</p>
              </div>
              <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
                <p className="font-mono text-[10px] text-on-surface-variant mb-1">JOINED</p>
                <p className="text-white font-bold">{launch.joined_count ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl text-white font-bold mb-4">Priority Window Allocation</h2>
            <p className="text-on-surface-variant leading-relaxed">
              You have Premium Priority Access active on your account. When the countdown expires, your exclusive allocation window will open, giving you early participation access before public listings.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={handleJoinLeave}
              disabled={joining}
              className={`px-8 py-3 rounded-xl font-mono font-bold text-xs transition-all ${
                hasJoined
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'bg-primary text-black hover:scale-105 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
              }`}
            >
              {joining ? 'Processing...' : hasJoined ? 'Joined ✓' : 'Join Launch'}
            </button>
            <Link to="/dashboard/user" className="inline-flex items-center justify-center bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-mono font-bold text-xs hover:bg-white/10 transition-all">
              Back to Overview
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  const priceChange = dexData ? Number(dexData.priceChange?.h24 || 0) : Number(launch.price_change_24h || 0);
  const isPositiveChange = priceChange >= 0;

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold tracking-wider uppercase ${
              launch.status === 'live' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse'
                : 'bg-primary/15 border border-primary/20 text-primary'
            }`}>
              {launch.status === 'live' ? '● Live Launch Active' : '✓ Verified TradePad Launch'}
            </span>
            <span className="text-on-surface-variant text-sm capitalize">{launch.chain}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white flex items-center gap-3">
            {launch.name} <span className="text-xl text-on-surface-variant font-mono font-normal">${launch.symbol}</span>
          </h1>
        </div>
        
        <Link to="/dashboard/user" className="bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-xl font-mono text-xs hover:bg-white/10 transition-colors">
          ← Back to Overview
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Chart & Information */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Large Interactive Price Chart */}
          <div className="glass-card p-6 md:p-8 rounded-[2rem] border-white/5 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Live Chart</p>
                <h3 className="text-lg font-bold text-white">Price History (24h)</h3>
              </div>
              <span className={`px-2.5 py-1 rounded font-mono text-xs font-bold ${isPositiveChange ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {isPositiveChange ? '▲' : '▼'} {priceChange}%
              </span>
            </div>

            {/* Premium Interactive Graph (Iframe or SVG fallback) */}
            {launch.pair_address || dexData?.pairAddress ? (
              <div className="h-[450px] w-full rounded-2xl overflow-hidden border border-white/5 bg-black/40 relative">
                <iframe 
                  title="dexscreener-chart"
                  src={`https://dexscreener.com/solana/${launch.pair_address || dexData.pairAddress}?embed=1&theme=dark&trades=0&info=0`}
                  className="w-full h-full border-none"
                />
              </div>
            ) : (
              <>
                <div className="h-64 w-full bg-black/20 rounded-2xl relative border border-white/5 flex items-end p-2 group cursor-crosshair">
                  {/* Grid Lines */}
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
                    <circle cx="250" cy="60" r="5" className="fill-primary stroke-background stroke-2 hidden group-hover:block transition-all" />
                  </svg>
                  
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-3 py-1.5 rounded-xl text-[11px] font-mono hidden group-hover:block text-white shadow-2xl">
                    Price: {formatUsd(launch.price)} | Vol: {formatUsd(launch.volume_24h)}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant/50 mt-3 px-1">
                  <span>24h ago</span>
                  <span>12h ago</span>
                  <span>Live Price</span>
                </div>
              </>
            )}
          </div>

          {/* Live Transaction Metrics */}
          {dexData?.txns && (
            <div className="glass-card p-6 md:p-8 rounded-[2rem] border-white/5 space-y-6">
              <div>
                <p className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Live Activity</p>
                <h3 className="text-xl font-bold text-white font-display">DEX Transaction Metrics</h3>
              </div>

              {/* Buy vs Sell Progress Bar */}
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
                    <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">24H Transaction Ratio</p>
                  </div>
                );
              })()}

              {/* Transaction breakdown table */}
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
                        <span className="text-emerald-400 font-bold">Buys</span>
                        <span className="text-white font-mono">{col.tx?.buys || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-400 font-bold">Sells</span>
                        <span className="text-white font-mono">{col.tx?.sells || 0}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1.5">
                        <span className="text-on-surface-variant">Volume</span>
                        <span className="text-white font-mono">{formatUsd(col.vol)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About section */}
          <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-4">
            <h2 className="text-xl font-bold text-white font-display border-b border-white/5 pb-4">About the Project</h2>
            <p className="text-on-surface-variant text-base leading-relaxed">
              {launch.description}
            </p>
          </div>

          {/* Launch Story */}
          {launch.launch_story && (
            <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-4">
              <h2 className="text-xl font-bold text-white font-display border-b border-white/5 pb-4">Launch Story</h2>
              <p className="text-on-surface-variant text-base leading-relaxed">
                {launch.launch_story}
              </p>
            </div>
          )}

          {/* Timeline section */}
          <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-6">
            <h2 className="text-xl font-bold text-white font-display border-b border-white/5 pb-4">Launch Timeline</h2>
            
            <div className="relative pl-8 border-l border-white/10 space-y-8">
              
              <div className={`relative ${activeTimelineStep >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center"></div>
                <h4 className="text-sm font-bold text-white">1. Announcement</h4>
                <p className="text-xs text-on-surface-variant mt-1">Project is announced publicly and whitelists open for early participants.</p>
              </div>

              <div className={`relative ${activeTimelineStep >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center"></div>
                <h4 className="text-sm font-bold text-white">2. Countdown Stage</h4>
                <p className="text-xs text-on-surface-variant mt-1">Members join the wave and await the launch pool block countdown.</p>
              </div>

              <div className={`relative ${activeTimelineStep >= 3 ? 'opacity-100' : 'opacity-40'}`}>
                <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center"></div>
                <h4 className="text-sm font-bold text-white">3. Launch Day</h4>
                <p className="text-xs text-on-surface-variant mt-1">Vetted Solana Token is generated and early allocations go live.</p>
              </div>

              <div className={`relative ${activeTimelineStep >= 4 ? 'opacity-100' : 'opacity-40'}`}>
                <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center"></div>
                <h4 className="text-sm font-bold text-white">4. DEX Listing & Markets</h4>
                <p className="text-xs text-on-surface-variant mt-1">Trading starts on Raydium with locked LP. Proof of work page begins tracking.</p>
              </div>

            </div>
          </div>
        </div>

        {/* Right 1 Column: Stats & Links */}
        <div className="space-y-6">
          
          {/* Live Market Metrics Card */}
          <div className="glass-card p-6 rounded-3xl border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-3">Market Statistics</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  Current Price 
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                </span>
                <span className="text-white font-bold font-mono">{formatUsd(dexData?.priceUsd || launch.price)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Market Cap</span>
                <span className="text-white font-bold">{formatUsd(dexData?.fdv || dexData?.marketCap || launch.market_cap)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Liquidity</span>
                <span className="text-white font-bold">{formatUsd(dexData?.liquidity?.usd || launch.liquidity)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">24h Volume</span>
                <span className="text-white font-bold">{formatUsd(dexData?.volume?.h24 || launch.volume_24h)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">FDV</span>
                <span className="text-white font-bold">{formatUsd(dexData?.fdv || launch.fdv)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
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

          {/* Project Details Info */}
          <div className="glass-card p-6 rounded-3xl border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-white font-display border-b border-white/5 pb-3">Contract Information</h3>
            <div className="space-y-3">
              <div>
                <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Mint Address</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white truncate font-mono select-all bg-white/5 px-2 py-1 rounded w-full">
                    {launch.mint_address || launch.contract_address || 'TBA'}
                  </span>
                </div>
              </div>
              {launch.pair_address && (
                <div>
                  <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Pair Address</p>
                  <span className="text-xs text-white truncate font-mono select-all bg-white/5 px-2 py-1 rounded w-full block">
                    {launch.pair_address}
                  </span>
                </div>
              )}
              {launch.creator_wallet && (
                <div>
                  <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Creator Wallet</p>
                  <span className="text-xs text-white truncate font-mono select-all bg-white/5 px-2 py-1 rounded w-full block">
                    {launch.creator_wallet}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Social Links Card */}
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
