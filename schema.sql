-- TradePad Supabase Schema
-- Core model for public launches, premium research, archives, and platform analytics.

create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.launch_status as enum ('draft', 'upcoming', 'live', 'closed', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.access_tier as enum ('free', 'premium', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.chain_name as enum ('solana', 'ethereum', 'base', 'bsc', 'polygon', 'other');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.risk_level as enum ('low', 'medium', 'high', 'critical');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  username text unique,
  role public.user_role not null default 'user',
  access_tier public.access_tier not null default 'free',
  wallet_address text,
  avatar_url text,
  bio text,
  is_premium boolean not null default false,
  premium_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_settings (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  notification_opt_in boolean not null default true,
  favorite_chain public.chain_name,
  onboarding_status text not null default 'pending',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  admin_title text not null default 'Administrator',
  permissions jsonb not null default '{"manage_users": true, "manage_launches": true, "manage_news": true}'::jsonb,
  last_admin_login_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, username, role, access_tier, is_premium)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'user',
    'free',
    false
  )
  on conflict (id) do nothing;

  insert into public.profile_settings (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  monthly_price_cents integer not null default 0,
  currency text not null default 'USD',
  is_public boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.launches (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  symbol text not null,
  tagline text,
  description text,
  chain public.chain_name not null default 'solana',
  status public.launch_status not null default 'upcoming',
  risk_level public.risk_level not null default 'medium',
  access_tier public.access_tier not null default 'free',
  featured boolean not null default false,
  is_teaser boolean not null default true,
  teaser_label text not null default 'Next Launch',
  teaser_summary text,
  joined_count integer not null default 0,
  launch_at timestamptz,
  go_live_at timestamptz,
  archive_at timestamptz,
  website_url text,
  x_url text,
  telegram_url text,
  contract_address text,
  cover_image_url text,
  logo_url text,
  market_cap numeric(24, 2),
  liquidity numeric(24, 2),
  total_supply numeric(36, 0),
  holder_count integer,
  funding_progress numeric(5, 2) default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.launch_milestones (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  title text not null,
  details text,
  milestone_order integer not null default 0,
  milestone_type text,
  target_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.launch_metrics (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  snapshot_at timestamptz not null default now(),
  price numeric(24, 12),
  market_cap numeric(24, 2),
  liquidity numeric(24, 2),
  volume_24h numeric(24, 2),
  holders integer,
  buys_24h integer,
  sells_24h integer,
  created_at timestamptz not null default now()
);

create table if not exists public.launch_allocation_groups (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  label text not null,
  percentage numeric(6, 2) not null,
  locked boolean not null default false,
  vesting_months integer,
  created_at timestamptz not null default now()
);

create table if not exists public.launch_research (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  summary text,
  ai_score integer check (ai_score >= 0 and ai_score <= 100),
  conviction_score integer check (conviction_score >= 0 and conviction_score <= 100),
  strengths jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  catalysts jsonb not null default '[]'::jsonb,
  is_premium boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.launch_updates (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  headline text not null,
  body text not null,
  update_type text not null default 'general',
  is_featured boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  summary text,
  body text not null,
  category text not null default 'platform',
  featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  launch_id uuid not null references public.launches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, launch_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  notification_type text not null default 'update',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_date date unique not null,
  free_users integer not null default 0,
  premium_users integer not null default 0,
  active_launches integer not null default 0,
  archived_launches integer not null default 0,
  monthly_mrr numeric(15, 2) not null default 0,
  total_volume numeric(24, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists launches_status_idx on public.launches(status);
create index if not exists launches_chain_idx on public.launches(chain);
create index if not exists launches_featured_idx on public.launches(featured);
create index if not exists launch_metrics_launch_id_snapshot_idx on public.launch_metrics(launch_id, snapshot_at desc);
create index if not exists launch_updates_launch_id_published_idx on public.launch_updates(launch_id, published_at desc);
create index if not exists news_posts_published_idx on public.news_posts(published_at desc);
