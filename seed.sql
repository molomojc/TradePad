-- TradePad seed data for Supabase
-- Assumes the schema in schema.sql already exists.

insert into public.plans (slug, name, description, monthly_price_cents, currency, is_public, featured)
values
  ('free', 'Free', 'Public launch browsing and archive access.', 0, 'USD', true, false),
  ('premium', 'Premium', 'Latest launch intelligence, deeper research, and priority updates.', 1500, 'USD', false, true)
on conflict (slug) do nothing;

insert into public.launches (
  slug, name, symbol, tagline, description, chain, status, risk_level, access_tier, featured, is_teaser, teaser_label, teaser_summary, joined_count,
  launch_at, go_live_at, website_url, x_url, telegram_url, market_cap, liquidity, total_supply, holder_count, funding_progress
)
values
  (
    'solflare-core',
    'Solflare Core',
    'SFC',
    'Premium launch with active research and latest market data.',
    'A Solana launch focused on community distribution, transparent allocations, and premium research coverage.',
    'solana',
    'live',
    'medium',
    'premium',
    true,
    true,
    'Next Launch',
    'Join the next launch before the project details are revealed.',
    284,
    now() + interval '2 days',
    now() - interval '1 hour',
    'https://example.com',
    'https://x.com',
    'https://t.me',
    1250000,
    220000,
    1000000000,
    18420,
    72.50
  ),
  (
    'older-wave',
    'Older Wave',
    'WAV',
    'Free archive listing for public browsing.',
    'An older community launch that remains visible in the public archive.',
    'base',
    'archived',
    'low',
    'free',
    false,
    false,
    'Public Archive',
    'A past launch remains visible for free browsing.',
    0,
    now() - interval '30 days',
    now() - interval '29 days',
    'https://example.com',
    'https://x.com',
    'https://t.me',
    5400000,
    810000,
    1000000000,
    36600,
    100
  )
on conflict (slug) do nothing;

insert into public.launch_allocation_groups (launch_id, label, percentage, locked, vesting_months)
select l.id, x.label, x.percentage, x.locked, x.vesting_months
from public.launches l
join (
  values
    ('solflare-core', 'Liquidity', 70.00, true, 12),
    ('solflare-core', 'Community', 15.00, false, null),
    ('solflare-core', 'Treasury', 10.00, true, 6),
    ('solflare-core', 'Team', 5.00, true, 18)
) as x(slug, label, percentage, locked, vesting_months) on x.slug = l.slug
on conflict do nothing;

insert into public.launch_milestones (launch_id, title, details, milestone_order, milestone_type, target_at, completed_at)
select l.id, x.title, x.details, x.milestone_order, x.milestone_type, x.target_at, x.completed_at
from public.launches l
join (
  values
    ('solflare-core', 'Whitelist ready', 'Public and premium access tiers configured.', 1, 'setup', now() - interval '3 days', now() - interval '3 days'),
    ('solflare-core', 'Liquidity seeded', 'Initial liquidity allocated for launch.', 2, 'launch', now() - interval '1 day', now() - interval '1 day'),
    ('solflare-core', 'Trading live', 'Launch is now available for tracking.', 3, 'live', now() + interval '2 days', null)
) as x(slug, title, details, milestone_order, milestone_type, target_at, completed_at) on x.slug = l.slug
on conflict do nothing;

insert into public.launch_metrics (launch_id, snapshot_at, price, market_cap, liquidity, volume_24h, holders, buys_24h, sells_24h)
select l.id, x.snapshot_at, x.price, x.market_cap, x.liquidity, x.volume_24h, x.holders, x.buys_24h, x.sells_24h
from public.launches l
join (
  values
    ('solflare-core', now() - interval '2 hours', 0.000001200000, 1250000, 220000, 64000, 18420, 320, 117),
    ('solflare-core', now() - interval '1 hour', 0.000001350000, 1380000, 231000, 78250, 18640, 380, 121),
    ('older-wave', now() - interval '12 hours', 0.000004800000, 5400000, 810000, 245000, 36600, 980, 210)
) as x(slug, snapshot_at, price, market_cap, liquidity, volume_24h, holders, buys_24h, sells_24h) on x.slug = l.slug
on conflict do nothing;

insert into public.launch_research (launch_id, summary, ai_score, conviction_score, strengths, risks, catalysts, is_premium, published_at)
select l.id, x.summary, x.ai_score, x.conviction_score, x.strengths::jsonb, x.risks::jsonb, x.catalysts::jsonb, x.is_premium, x.published_at
from public.launches l
join (
  values
    (
      'solflare-core',
      'Premium research covers a strong community launch with clean token allocation, locked liquidity, and active demand.',
      87,
      84,
      '["Clear allocation structure","Visible launch roadmap","Strong liquidity backing"]',
      '["Market volatility","Fast rotation risk","Low patience among holders"]',
      '["Exchange listing catalyst","Community growth","Social attention"]',
      true,
      now() - interval '30 minutes'
    )
) as x(slug, summary, ai_score, conviction_score, strengths, risks, catalysts, is_premium, published_at) on x.slug = l.slug
on conflict do nothing;

insert into public.launch_updates (launch_id, headline, body, update_type, is_featured, published_at)
select l.id, x.headline, x.body, x.update_type, x.is_featured, x.published_at
from public.launches l
join (
  values
    ('solflare-core', 'Premium data refreshed', 'Latest live metrics were synced from the launch feed.', 'metrics', true, now() - interval '15 minutes'),
    ('older-wave', 'Archive entry finalized', 'This launch has moved to the public archive.', 'archive', false, now() - interval '2 days')
) as x(slug, headline, body, update_type, is_featured, published_at) on x.slug = l.slug
on conflict do nothing;

insert into public.news_posts (title, slug, summary, body, category, featured, published_at)
values
  (
    'Launch research layer is now live',
    'launch-research-layer-live',
    'Premium users can now receive launch notes and scoring from dedicated tables.',
    'TradePad now separates public launch visibility from premium research and update streams.',
    'platform',
    true,
    now() - interval '1 day'
  ),
  (
    'Archive browsing improved',
    'archive-browsing-improved',
    'Older launches are easier to review with metric snapshots and post-launch history.',
    'The archive layer supports closed and archived launches with historical snapshots.',
    'product',
    false,
    now() - interval '2 days'
  )
on conflict (slug) do nothing;

insert into public.platform_metrics (metric_date, free_users, premium_users, active_launches, archived_launches, monthly_mrr, total_volume)
values
  (current_date, 1240, 86, 1, 1, 1290.00, 678000.00)
on conflict (metric_date) do nothing;
