import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';

const formatUtcToLocalDatetime = (utcString) => {
  if (!utcString) return '';
  let formattedString = utcString;
  if (!formattedString.endsWith('Z') && !formattedString.includes('+') && !formattedString.includes('-')) {
    formattedString = formattedString + 'Z';
  }
  const date = new Date(formattedString);
  if (Number.isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const parseLocalDatetimeToUtcIso = (dateTimeStr) => {
  if (!dateTimeStr) return null;
  const parts = dateTimeStr.split('T');
  if (parts.length !== 2) {
    const d = new Date(dateTimeStr);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const dateParts = parts[0].split('-');
  const timeParts = parts[1].split(':');
  
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const day = parseInt(dateParts[2], 10);
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  
  const localDate = new Date(year, month, day, hours, minutes);
  if (Number.isNaN(localDate.getTime())) return null;
  return localDate.toISOString();
};

const emptyMilestones = [
  { title: 'Whitelist / waitlist', details: '', milestone_order: 1, milestone_type: 'setup' },
  { title: 'Liquidity setup', details: '', milestone_order: 2, milestone_type: 'launch' },
  { title: 'Live trading', details: '', milestone_order: 3, milestone_type: 'live' },
];

export default function CreateLaunch() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !supabase) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('membucket')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('membucket')
        .getPublicUrl(filePath);

      updateField('logo_url', publicUrl);
    } catch (err) {
      console.error('Error uploading logo:', err);
      alert('Upload failed: ' + (err.message || err));
    } finally {
      setUploadingLogo(false);
    }
  };

  const [form, setForm] = useState({
    name: '',
    slug: '',
    symbol: '',
    tagline: '',
    description: '',
    chain: 'solana',
    status: 'upcoming',
    risk_level: 'medium',
    access_tier: 'free',
    launch_at: '',
    market_cap: '',
    liquidity: '',
    total_supply: '',
    holder_count: '',
    funding_progress: '',
    joined_count: '',
    teaser_label: 'Next Launch',
    teaser_summary: 'Join the next launch before the project details are revealed.',
    is_teaser: true,
    website_url: '',
    x_url: '',
    telegram_url: '',
    contract_address: '',
    logo_url: '',
    ai_score: '',
    conviction_score: '',
    strengths: '',
    risks: '',
    catalysts: '',
    mint_address: '',
    pair_address: '',
    creator_wallet: '',
    launch_price: '',
    launch_market_cap: '',
    launch_liquidity: '',
  });

  const [allocationRows, setAllocationRows] = useState([
    { label: 'Liquidity', percentage: '70', locked: true, vesting_months: '12' },
    { label: 'Community', percentage: '15', locked: false, vesting_months: '' },
    { label: 'Treasury', percentage: '10', locked: true, vesting_months: '6' },
    { label: 'Team', percentage: '5', locked: true, vesting_months: '18' },
  ]);

  const tabs = useMemo(() => [
    { id: 'general', label: 'General Info' },
    { id: 'project', label: 'Project Info' },
    { id: 'tokenomics', label: 'Tokenomics' },
    { id: 'media', label: 'Media & Links' },
    { id: 'visibility', label: 'Visibility' },
    { id: 'premium', label: 'Premium Research' },
    { id: 'seo', label: 'SEO' },
  ], []);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  // Load existing launch data if editing
  useEffect(() => {
    if (!id || !supabase) return;
    const loadLaunchData = async () => {
      try {
        setMessage('Loading launch details...');
        const { data: launch, error } = await supabase
          .from('launches')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!launch) {
          setMessage('Launch not found.');
          return;
        }

        setForm({
          name: launch.name || '',
          slug: launch.slug || '',
          symbol: launch.symbol || '',
          tagline: launch.tagline || '',
          description: launch.description || '',
          chain: launch.chain || 'solana',
          status: launch.status || 'upcoming',
          risk_level: launch.risk_level || 'medium',
          access_tier: launch.access_tier || 'free',
          launch_at: formatUtcToLocalDatetime(launch.launch_at),
          market_cap: launch.market_cap || '',
          liquidity: launch.liquidity || '',
          total_supply: launch.total_supply || '',
          holder_count: launch.holder_count || '',
          funding_progress: launch.funding_progress || '',
          joined_count: launch.joined_count || '',
          teaser_label: launch.teaser_label || 'Next Launch',
          teaser_summary: launch.teaser_summary || 'Join the next launch before the project details are revealed.',
          is_teaser: launch.is_teaser ?? true,
          website_url: launch.website_url || '',
          x_url: launch.x_url || '',
          telegram_url: launch.telegram_url || '',
          contract_address: launch.contract_address || '',
          logo_url: launch.logo_url || '',
          ai_score: '',
          conviction_score: '',
          strengths: '',
          risks: '',
          catalysts: '',
          mint_address: launch.mint_address || '',
          pair_address: launch.pair_address || '',
          creator_wallet: launch.creator_wallet || '',
          launch_price: launch.launch_price || '',
          launch_market_cap: launch.launch_market_cap || '',
          launch_liquidity: launch.launch_liquidity || '',
        });

        // Load allocations
        const { data: allocations } = await supabase
          .from('launch_allocation_groups')
          .select('*')
          .eq('launch_id', id)
          .order('id', { ascending: true });

        if (allocations && allocations.length > 0) {
          setAllocationRows(allocations.map(a => ({
            label: a.label || '',
            percentage: String(a.percentage || 0),
            locked: Boolean(a.locked),
            vesting_months: a.vesting_months ? String(a.vesting_months) : '',
          })));
        }

        // Load research
        const { data: research } = await supabase
          .from('launch_research')
          .select('*')
          .eq('launch_id', id)
          .maybeSingle();

        if (research) {
          setForm(current => ({
            ...current,
            ai_score: research.ai_score !== null ? String(research.ai_score) : '',
            conviction_score: research.conviction_score !== null ? String(research.conviction_score) : '',
            strengths: Array.isArray(research.strengths) ? research.strengths.join('\n') : '',
            risks: Array.isArray(research.risks) ? research.risks.join('\n') : '',
            catalysts: Array.isArray(research.catalysts) ? research.catalysts.join('\n') : '',
          }));
        }

        setMessage('');
      } catch (err) {
        console.error('Error loading launch data:', err);
        setMessage('Error loading launch details.');
      }
    };
    loadLaunchData();
  }, [id]);

  const saveLaunch = async (publish = false) => {
    if (!supabase) {
      setMessage('Connect Supabase first.');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      const slug = form.slug.trim().toLowerCase();
      if (!form.name || !slug) {
        throw new Error('Name, slug, and symbol are required.');
      }

      const { data: profileData } = await supabase.auth.getUser();
      const userId = profileData?.user?.id || null;

      let launchId = id;

      if (isEditing) {
        const { error: launchError } = await supabase
          .from('launches')
          .update({
            name: form.name,
            slug,
            symbol: form.symbol.toUpperCase(),
            tagline: form.tagline,
            description: form.description,
            chain: form.chain,
            status: publish ? 'upcoming' : form.status,
            risk_level: form.risk_level,
            access_tier: form.access_tier,
            launch_at: parseLocalDatetimeToUtcIso(form.launch_at),
            market_cap: form.market_cap ? Number(form.market_cap) : null,
            liquidity: form.liquidity ? Number(form.liquidity) : null,
            total_supply: form.total_supply ? Number(form.total_supply) : null,
            holder_count: form.holder_count ? Number(form.holder_count) : null,
            funding_progress: form.funding_progress ? Number(form.funding_progress) : 0,
            joined_count: form.joined_count ? Number(form.joined_count) : 0,
            teaser_label: form.teaser_label,
            teaser_summary: form.teaser_summary,
            is_teaser: Boolean(form.is_teaser),
            website_url: form.website_url || null,
            x_url: form.x_url || null,
            telegram_url: form.telegram_url || null,
            contract_address: form.contract_address || null,
            logo_url: form.logo_url || null,
            mint_address: form.mint_address || null,
            pair_address: form.pair_address || null,
            creator_wallet: form.creator_wallet || null,
            launch_price: form.launch_price ? Number(form.launch_price) : null,
            launch_market_cap: form.launch_market_cap ? Number(form.launch_market_cap) : null,
            launch_liquidity: form.launch_liquidity ? Number(form.launch_liquidity) : null,
            website: form.website_url || null,
            twitter: form.x_url || null,
            telegram: form.telegram_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (launchError) throw launchError;

        // Clean up old allocations and research so we can rebuild them
        await supabase.from('launch_allocation_groups').delete().eq('launch_id', launchId);
        await supabase.from('launch_research').delete().eq('launch_id', launchId);
      } else {
        const { data: launch, error: launchError } = await supabase
          .from('launches')
          .insert({
            name: form.name,
            slug,
            symbol: form.symbol.toUpperCase(),
            tagline: form.tagline,
            description: form.description,
            chain: form.chain,
            status: publish ? 'upcoming' : form.status,
            risk_level: form.risk_level,
            access_tier: form.access_tier,
            launch_at: parseLocalDatetimeToUtcIso(form.launch_at),
            market_cap: form.market_cap ? Number(form.market_cap) : null,
            liquidity: form.liquidity ? Number(form.liquidity) : null,
            total_supply: form.total_supply ? Number(form.total_supply) : null,
            holder_count: form.holder_count ? Number(form.holder_count) : null,
            funding_progress: form.funding_progress ? Number(form.funding_progress) : 0,
            joined_count: form.joined_count ? Number(form.joined_count) : 0,
            teaser_label: form.teaser_label,
            teaser_summary: form.teaser_summary,
            is_teaser: Boolean(form.is_teaser),
            website_url: form.website_url || null,
            x_url: form.x_url || null,
            telegram_url: form.telegram_url || null,
            contract_address: form.contract_address || null,
            logo_url: form.logo_url || null,
            created_by: userId,
            mint_address: form.mint_address || null,
            pair_address: form.pair_address || null,
            creator_wallet: form.creator_wallet || null,
            launch_price: form.launch_price ? Number(form.launch_price) : null,
            launch_market_cap: form.launch_market_cap ? Number(form.launch_market_cap) : null,
            launch_liquidity: form.launch_liquidity ? Number(form.launch_liquidity) : null,
            website: form.website_url || null,
            twitter: form.x_url || null,
            telegram: form.telegram_url || null,
          })
          .select()
          .single();

        if (launchError) throw launchError;
        launchId = launch.id;

        // Create default milestones for new launches ONLY
        await supabase.from('launch_milestones').insert(
          emptyMilestones.map((milestone) => ({
            launch_id: launchId,
            ...milestone,
          }))
        );
      }

      // Re-insert allocation groups
      await supabase.from('launch_allocation_groups').insert(
        allocationRows.map((row) => ({
          launch_id: launchId,
          label: row.label,
          percentage: Number(row.percentage || 0),
          locked: Boolean(row.locked),
          vesting_months: row.vesting_months ? Number(row.vesting_months) : null,
        }))
      );

      const strengths = form.strengths.split('\n').map((item) => item.trim()).filter(Boolean);
      const risks = form.risks.split('\n').map((item) => item.trim()).filter(Boolean);
      const catalysts = form.catalysts.split('\n').map((item) => item.trim()).filter(Boolean);

      if (form.ai_score || form.conviction_score || strengths.length || risks.length || catalysts.length) {
        await supabase.from('launch_research').insert({
          launch_id: launchId,
          profile_id: userId,
          summary: form.tagline || form.description,
          ai_score: form.ai_score ? Number(form.ai_score) : null,
          conviction_score: form.conviction_score ? Number(form.conviction_score) : null,
          strengths,
          risks,
          catalysts,
          is_premium: form.access_tier !== 'free',
        });
      }

      setMessage(isEditing ? 'Launch updated successfully.' : 'Launch created successfully.');
      navigate('/dashboard/admin/launches');
    } catch (error) {
      setMessage(error?.message || 'Unable to save launch.');
    } finally {
      setSaving(false);
    }
  };

  if (!hasSupabaseConfig) {
    return <div className="glass-card p-6 border-white/5 rounded-2xl text-on-surface-variant">Connect Supabase to create launches.</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display-lg font-bold text-white mb-2">
            {isEditing ? 'Edit Launch' : 'Create New Launch'}
          </h1>
          <p className="text-on-surface-variant text-sm">
            {isEditing ? 'Modify the core details, tokenomics, and premium research of this launch.' : 'Create the core launch row first. Milestones, allocations, and research are created automatically.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => saveLaunch(false)} disabled={saving} className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-xl font-mono text-xs hover:bg-white/10 transition-colors disabled:opacity-60">
            {saving ? 'Saving...' : isEditing ? 'Update Draft' : 'Save Draft'}
          </button>
          <button onClick={() => saveLaunch(true)} disabled={saving} className="bg-primary text-black px-6 py-2.5 rounded-xl font-mono text-xs font-bold hover:opacity-90 shadow-[0_0_15px_rgba(198,198,198,0.2)] disabled:opacity-60">
            {saving ? 'Saving...' : isEditing ? 'Update & Publish' : 'Publish Launch'}
          </button>
        </div>
      </div>

      {message && <div className="glass-card p-4 rounded-2xl border-white/5 text-on-surface-variant">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-xl font-label-mono text-[13px] transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
                  : 'text-on-surface-variant hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 glass-card p-8 rounded-3xl border-white/5">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">General Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <Field label="PROJECT NAME" value={form.name} onChange={(value) => updateField('name', value)} placeholder="e.g. Project Olympus" />
                <Field label="SLUG" value={form.slug} onChange={(value) => updateField('slug', value)} placeholder="project-olympus" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Field label="TAGLINE" value={form.tagline} onChange={(value) => updateField('tagline', value)} placeholder="Short launch hook" />
                <Field as="select" label="CHAIN" value={form.chain} onChange={(value) => updateField('chain', value)} options={['solana', 'base', 'ethereum', 'bsc', 'polygon']} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Field as="select" label="RISK LEVEL" value={form.risk_level} onChange={(value) => updateField('risk_level', value)} options={['low', 'medium', 'high', 'critical']} />
                <Field label="LAUNCH DATE" type="datetime-local" value={form.launch_at} onChange={(value) => updateField('launch_at', value)} />
              </div>
            </div>
          )}

          {activeTab === 'tokenomics' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">Tokenomics & Allocations</h2>
              <div className="grid grid-cols-2 gap-6">
                <Field label="TOTAL SUPPLY" value={form.total_supply} onChange={(value) => updateField('total_supply', value)} placeholder="1000000000" />
                <Field label="CREATOR WALLET" value={form.creator_wallet} onChange={(value) => updateField('creator_wallet', value)} placeholder="Solana wallet address" />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <Field label="LAUNCH PRICE (USD)" type="number" value={form.launch_price} onChange={(value) => updateField('launch_price', value)} placeholder="0.0001" />
                <Field label="LAUNCH MARKET CAP (USD)" type="number" value={form.launch_market_cap} onChange={(value) => updateField('launch_market_cap', value)} placeholder="50000" />
                <Field label="LAUNCH LIQUIDITY (USD)" type="number" value={form.launch_liquidity} onChange={(value) => updateField('launch_liquidity', value)} placeholder="10000" />
              </div>
              <div className="space-y-4 pt-4">
                <label className="font-label-mono text-[11px] text-on-surface-variant block">ALLOCATIONS (%)</label>
                {allocationRows.map((row, index) => (
                  <div key={row.label} className="grid grid-cols-[1.2fr_0.7fr_0.6fr_0.7fr] gap-3 items-center">
                    <span className="text-sm text-white">{row.label}</span>
                    <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-primary/50" value={row.percentage} onChange={(event) => setAllocationRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, percentage: event.target.value } : item))} />
                    <label className="flex items-center gap-2 text-white text-sm">
                      <input type="checkbox" checked={row.locked} onChange={(event) => setAllocationRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, locked: event.target.checked } : item))} />
                      Locked
                    </label>
                    <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-primary/50" value={row.vesting_months} onChange={(event) => setAllocationRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, vesting_months: event.target.value } : item))} placeholder="Months" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'premium' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">Premium Research</h2>
              <div className="grid grid-cols-2 gap-6">
                <Field label="AI SCORE (0-100)" type="number" value={form.ai_score} onChange={(value) => updateField('ai_score', value)} />
                <Field label="CONVICTION (0-100)" type="number" value={form.conviction_score} onChange={(value) => updateField('conviction_score', value)} />
              </div>
              <Field as="textarea" label="STRENGTHS (One per line)" value={form.strengths} onChange={(value) => updateField('strengths', value)} placeholder={'Highly engaged community\nStrong liquidity'} />
              <Field as="textarea" label="RISKS" value={form.risks} onChange={(value) => updateField('risks', value)} placeholder="High volatility" />
              <Field as="textarea" label="CATALYSTS" value={form.catalysts} onChange={(value) => updateField('catalysts', value)} placeholder="Exchange listing" />
            </div>
          )}

          {activeTab === 'project' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">Project Information</h2>
              <Field as="textarea" label="DESCRIPTION" value={form.description} onChange={(value) => updateField('description', value)} placeholder="Short launch description..." />
              <Field label="ACCESS TIER" as="select" value={form.access_tier} onChange={(value) => updateField('access_tier', value)} options={['free', 'premium']} />
              <Field label="HOLDER COUNT" type="number" value={form.holder_count} onChange={(value) => updateField('holder_count', value)} />
              <Field label="FUNDING PROGRESS %" type="number" value={form.funding_progress} onChange={(value) => updateField('funding_progress', value)} />
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">Media & Links</h2>
              <div className="grid grid-cols-2 gap-6">
                <Field label="WEBSITE" value={form.website_url} onChange={(value) => updateField('website_url', value)} />
                <Field label="X / TWITTER" value={form.x_url} onChange={(value) => updateField('x_url', value)} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Field label="TELEGRAM" value={form.telegram_url} onChange={(value) => updateField('telegram_url', value)} />
                <div>
                  <label className="font-label-mono text-[11px] text-on-surface-variant block mb-2">LOGO / PICTURE</label>
                  <div className="flex gap-4 items-center">
                    {form.logo_url && (
                      <img src={form.logo_url} alt="Token Logo Preview" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                    )}
                    <div className="flex-1 relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload-input"
                      />
                      <label 
                        htmlFor="logo-upload-input" 
                        className="w-full bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between transition-colors"
                      >
                        <span>{uploadingLogo ? 'Uploading...' : 'Upload Image'}</span>
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">upload_file</span>
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={form.logo_url}
                    onChange={(event) => updateField('logo_url', event.target.value)}
                    placeholder="Or enter logo URL manually"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none mt-2 focus:border-primary/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <Field label="CONTRACT ADDRESS" value={form.contract_address} onChange={(value) => updateField('contract_address', value)} />
                <Field label="DEXSCREENER MINT ADDRESS" value={form.mint_address} onChange={(value) => updateField('mint_address', value)} placeholder="Token mint address" />
                <Field label="DEXSCREENER PAIR ADDRESS" value={form.pair_address} onChange={(value) => updateField('pair_address', value)} placeholder="LP pair address (optional)" />
              </div>
            </div>
          )}

          {activeTab === 'visibility' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">Launch Visibility</h2>
              <label className="flex items-center gap-3 text-white text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <input type="checkbox" checked={Boolean(form.is_teaser)} onChange={(event) => updateField('is_teaser', event.target.checked)} />
                Hide coin identity on the upcoming launch card
              </label>
              <Field label="TEASER TITLE" value={form.teaser_label} onChange={(value) => updateField('teaser_label', value)} placeholder="Next Launch" />
              <Field as="textarea" label="TEASER SUMMARY" value={form.teaser_summary} onChange={(value) => updateField('teaser_summary', value)} placeholder="Join the next launch before the project details are revealed." />
              <Field label="JOINED COUNT" type="number" value={form.joined_count} onChange={(value) => updateField('joined_count', value)} placeholder="0" />
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-6 animate-in fade-in text-center py-20">
              <span className="material-symbols-outlined text-4xl text-white/20 mb-3 block">construction</span>
              <p className="text-on-surface-variant">SEO fields can be added once the launch workflow is stable.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, as = 'input', type = 'text', placeholder = '', options = [] }) {
  return (
    <div>
      <label className="font-label-mono text-[11px] text-on-surface-variant block mb-2">{label}</label>
      {as === 'textarea' ? (
        <textarea
          rows="4"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50"
        />
      ) : as === 'select' ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 appearance-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50"
        />
      )}
    </div>
  );
}
