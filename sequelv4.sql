-- TradePad Schema V4 Upgrade
-- Adds newsroom maintenance fields and admin dashboard tracking indexes.

alter table public.news_posts
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

create index if not exists news_posts_category_idx on public.news_posts(category);
create index if not exists news_posts_featured_idx on public.news_posts(featured);
create index if not exists platform_metrics_metric_date_idx on public.platform_metrics(metric_date desc);
create index if not exists launches_created_at_idx on public.launches(created_at desc);

