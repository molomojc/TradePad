-- TradePad Money Tree pricing seed
-- Safe to run after the core schema exists.

insert into public.plans (slug, name, description, monthly_price_cents, currency, is_public, featured)
values
  (
    'free',
    'Free',
    'Public launch archive, community updates, and read-only access.',
    0,
    'USD',
    true,
    false
  ),
  (
    'premium',
    'Premium',
    'Next launch teasers, premium research, and priority insights.',
    1500,
    'USD',
    false,
    true
  ),
  (
    'annual',
    'Annual',
    'Best value plan with priority support and locked-in pricing.',
    19900,
    'USD',
    false,
    false
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  monthly_price_cents = excluded.monthly_price_cents,
  currency = excluded.currency,
  is_public = excluded.is_public,
  featured = excluded.featured,
  updated_at = now();

comment on table public.plans is 'Money Tree pricing tiers for TradePad billing and access.';
