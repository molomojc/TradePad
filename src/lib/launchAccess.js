import { hasSupabaseConfig, supabase } from './supabase';

export function formatCountdown(targetDate) {
  if (!targetDate) return 'TBA';
  const target = new Date(targetDate).getTime();
  const diff = target - Date.now();
  if (Number.isNaN(target) || diff <= 0) return '00:00:00';

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function normalizeLaunch(row) {
  if (!row) return null;

  return {
    ...row,
    teaser_label: row.teaser_label || 'Next Launch',
    teaser_summary: row.teaser_summary || 'Join the next launch before details are revealed.',
    joined_count: row.joined_count ?? 0,
    countdown: formatCountdown(row.launch_at || row.go_live_at),
  };
}

export async function fetchLaunches(query = {}) {
  if (!supabase || !hasSupabaseConfig) return { data: [], error: null };

  let request = supabase.from('launches').select('*').order('launch_at', { ascending: true });

  if (query.status) request = request.eq('status', query.status);
  if (query.accessTier) request = request.eq('access_tier', query.accessTier);
  if (query.limit) request = request.limit(query.limit);

  const { data, error } = await request;
  return { data: (data || []).map(normalizeLaunch), error };
}

export function getHiddenLaunchCard(launch) {
  if (!launch) return null;

  return {
    id: launch.id,
    title: launch.teaser_label || 'Next Launch',
    subtitle: launch.teaser_summary || 'Details stay hidden until the launch window opens.',
    countdown: formatCountdown(launch.launch_at || launch.go_live_at),
    joined_count: launch.joined_count ?? 0,
    cta: 'Join the Next Launch',
  };
}
