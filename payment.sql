-- TradePad payment schema
-- Tracks Lemon Squeezy checkout attempts, confirmed payments, and local access upgrades.

create extension if not exists pgcrypto;

do $$
begin
  create type public.payment_provider as enum ('lemonsqueezy');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  provider public.payment_provider not null default 'lemonsqueezy',
  provider_checkout_id text,
  provider_order_id text,
  provider_subscription_id text,
  plan_slug text not null,
  status public.payment_status not null default 'pending',
  amount_cents integer not null default 0,
  currency text not null default 'USD',
  checkout_url text,
  customer_email text,
  raw_payload jsonb,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payments_provider_checkout_id_key
  on public.payments (provider, provider_checkout_id)
  where provider_checkout_id is not null;

create unique index if not exists payments_provider_order_id_key
  on public.payments (provider, provider_order_id)
  where provider_order_id is not null;

create unique index if not exists payments_provider_subscription_id_key
  on public.payments (provider, provider_subscription_id)
  where provider_subscription_id is not null;

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete cascade,
  provider public.payment_provider not null default 'lemonsqueezy',
  event_name text not null,
  event_id text,
  profile_id uuid references public.profiles(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists payment_events_provider_event_id_key
  on public.payment_events (provider, event_id)
  where event_id is not null;

create index if not exists payments_profile_id_idx on public.payments (profile_id);
create index if not exists payment_events_profile_id_idx on public.payment_events (profile_id);

