-- MemLaunch Schema V3 Upgrade
-- Adds hidden launch teaser fields for the premium reveal flow.

ALTER TABLE public.launches
  ADD COLUMN IF NOT EXISTS is_teaser boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS teaser_label text NOT NULL DEFAULT 'Next Launch',
  ADD COLUMN IF NOT EXISTS teaser_summary text,
  ADD COLUMN IF NOT EXISTS joined_count integer NOT NULL DEFAULT 0;

