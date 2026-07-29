import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isBrowserSafeSupabaseKey =
  Boolean(supabaseAnonKey) &&
  !supabaseAnonKey.startsWith('sb_secret_') &&
  !supabaseAnonKey.toLowerCase().includes('service_role');

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey) && isBrowserSafeSupabaseKey;
export const supabaseConfigError = Boolean(supabaseUrl && supabaseAnonKey) && !isBrowserSafeSupabaseKey
  ? 'Your browser is using a Supabase secret/service key. Replace it with the public anon key from Supabase project settings.'
  : '';

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function fetchCurrentUserProfile() {
  if (!supabase) return { profile: null, session: null };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) return { profile: null, session: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  return { profile, session };
}

export async function ensureProfileRow(user, overrides = {}) {
  if (!supabase || !user?.id) {
    return { data: null, error: null };
  }

  const profilePayload = {
    id: user.id,
    email: overrides.email || user.email || null,
    full_name: overrides.full_name || user.user_metadata?.full_name || user.email || null,
    username:
      overrides.username ||
      user.user_metadata?.username ||
      (user.email ? user.email.split('@')[0] : null),
    role: overrides.role || 'user',
    access_tier: overrides.access_tier || 'free',
    wallet_address: overrides.wallet_address ?? null,
    avatar_url: overrides.avatar_url ?? null,
    bio: overrides.bio ?? null,
    is_premium: Boolean(overrides.is_premium),
    is_founding_member: Boolean(overrides.is_founding_member),
    premium_expires_at: overrides.premium_expires_at ?? null,
    updated_at: new Date().toISOString(),
  };

  const profileResult = await supabase
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' })
    .select()
    .maybeSingle();

  return {
    profile: profileResult.data ?? null,
    error: profileResult.error || null,
  };
}

export async function fetchCurrentAccess() {
  if (!supabase) return { profile: null, session: null, isPremium: false, accessTier: 'free', isFoundingMember: false };

  const { profile, session } = await fetchCurrentUserProfile();
  const isPremium = profile?.access_tier === 'premium' || profile?.is_premium || profile?.role === 'admin' || profile?.is_founding_member;

  return {
    profile,
    session,
    isPremium,
    isFoundingMember: profile?.is_founding_member || false,
    accessTier: profile?.access_tier || 'free',
  };
}

export async function fetchSubscriptionStatus() {
  if (!supabase) return { subscription: null, isActive: false };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) return { subscription: null, isActive: false };

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, plans(is_public, featured, slug, name)')
    .eq('profile_id', session.user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  return { subscription: subscription ?? null, isActive: !!subscription };
}

export async function getPlatformSettings(key) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  
  return data?.value ?? null;
}

export async function signInWithOAuth(provider) {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/dashboard/user`,
    },
  });
}

export async function signInWithPassword(email, password) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email, password) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: email ? email.split('@')[0] : '',
        username: email ? email.split('@')[0] : '',
      },
    },
  });
}
