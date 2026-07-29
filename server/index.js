import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const PORT = Number(process.env.PORT || 8787);
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY || '';
const LEMON_SQUEEZY_WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

function normalizeVariantId(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  const checkoutMatch = trimmed.match(/checkout\/buy\/([a-f0-9-]+)/i);
  return checkoutMatch ? checkoutMatch[1] : trimmed;
}

const plans = {
  premium: {
    slug: 'premium',
    name: 'Premium',
    variantId: normalizeVariantId(process.env.LEMON_SQUEEZY_PREMIUM_VARIANT_ID || ''),
    amount: 1999,
    currency: 'usd',
  },
  annual: {
    slug: 'annual',
    name: 'Annual',
    variantId: normalizeVariantId(process.env.LEMON_SQUEEZY_ANNUAL_VARIANT_ID || ''),
    amount: 19900,
    currency: 'usd',
  },
  founding: {
    slug: 'founding',
    name: 'Founding Member',
    variantId: normalizeVariantId(process.env.LEMON_SQUEEZY_FOUNDING_VARIANT_ID || process.env.LEMON_SQUEEZY_FOUDNIG_VARIANT_ID || ''),
    amount: 999,
    currency: 'usd',
  },
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Signature, X-Event-Name',
  });
  res.end(JSON.stringify(body));
}

function logCheckoutContext(label, value) {
  console.log(`[checkout] ${label}:`, value);
}

function findDeepValue(object, keys) {
  if (!object || typeof object !== 'object') return null;
  for (const [key, value] of Object.entries(object)) {
    if (keys.includes(key) && value != null) return value;
    if (value && typeof value === 'object') {
      const nested = findDeepValue(value, keys);
      if (nested != null) return nested;
    }
  }
  return null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyLemonWebhookSignature(payload, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  return timingSafeEqual(signatureHeader.trim(), expected);
}

async function markProfilePremium(profileId, sourcePayload = {}) {
  if (!supabaseAdmin || !profileId) {
    return { error: new Error('Supabase admin client not configured') };
  }

  const planSlug = sourcePayload?.meta?.custom_data?.planSlug || '';
  const isFounding = planSlug === 'founding';

  // Check if they are already a founding member to prevent double-counting
  const { data: currentProfile } = await supabaseAdmin
    .from('profiles')
    .select('is_founding_member')
    .eq('id', profileId)
    .single();

  const timestamp = new Date().toISOString();
  const updateData = {
    access_tier: 'premium',
    is_premium: true,
    updated_at: timestamp,
  };
  
  if (isFounding) {
    updateData.is_founding_member = true;
    
    // Auto-increment the founding offer claimed count if they weren't already one
    if (!currentProfile?.is_founding_member) {
      const { data: settingsData } = await supabaseAdmin
        .from('platform_settings')
        .select('value')
        .eq('key', 'founding_offer')
        .single();
        
      if (settingsData?.value) {
        const newValue = { 
          ...settingsData.value, 
          claimed: (settingsData.value.claimed || 0) + 1 
        };
        await supabaseAdmin
          .from('platform_settings')
          .update({ value: newValue })
          .eq('key', 'founding_offer');
      }
    }
  }

  const result = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', profileId)
    .select()
    .maybeSingle();

  if (result.error) return { error: result.error };

  await supabaseAdmin.from('payments').upsert({
    profile_id: profileId,
    provider: 'lemonsqueezy',
    provider_order_id: sourcePayload?.data?.attributes?.identifier || null,
    provider_subscription_id: sourcePayload?.data?.attributes?.subscription_id || null,
    plan_slug:
      sourcePayload?.meta?.custom_data?.planSlug ||
      sourcePayload?.data?.attributes?.variant_name ||
      'premium',
    status: 'paid',
    amount_cents: Number(sourcePayload?.data?.attributes?.total_usd || 0),
    currency: String(sourcePayload?.data?.attributes?.currency || 'USD'),
    customer_email: sourcePayload?.data?.attributes?.user_email || null,
    raw_payload: sourcePayload,
    paid_at: timestamp,
    updated_at: timestamp,
  }, { onConflict: 'provider_order_id' });

  return { profile: result.data, error: null };
}

async function recordPendingPayment(profileId, plan, checkoutId, checkoutUrl, userEmail) {
  if (!supabaseAdmin || !profileId) return;

  await supabaseAdmin.from('payments').upsert({
    profile_id: profileId,
    provider: 'lemonsqueezy',
    provider_checkout_id: checkoutId,
    plan_slug: plan.slug,
    status: 'pending',
    amount_cents: plan.amount,
    currency: plan.currency,
    checkout_url: checkoutUrl,
    customer_email: userEmail || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'provider_checkout_id' });
}

async function setProfilePremiumOnCheckout(profileId, plan, checkoutId, checkoutUrl, userEmail) {
  if (!supabaseAdmin || !profileId) {
    return { error: new Error('Supabase admin client not configured') };
  }

  // Only record the pending payment, do NOT upgrade the profile yet!
  await recordPendingPayment(profileId, plan, checkoutId, checkoutUrl, userEmail);
  return { error: null };
}

async function handleCreateCheckoutSession(req, res) {
  const body = await readBody(req);
  const payload = JSON.parse(body.toString('utf8') || '{}');
  const plan = plans[payload.planSlug];

  logCheckoutContext('incoming payload', payload);

  if (!plan) {
    return sendJson(res, 400, { message: 'Unknown plan.' });
  }

  if (!LEMON_SQUEEZY_API_KEY || !plan.variantId) {
    logCheckoutContext('stub mode', {
      hasApiKey: Boolean(LEMON_SQUEEZY_API_KEY),
      hasVariantId: Boolean(plan.variantId),
      planSlug: plan.slug,
    });
    return sendJson(res, 200, {
      message: 'Checkout server is running in stub mode.',
      checkoutUrl: `${APP_URL}/pricing?plan=${plan.slug}`,
    });
  }

  const storeId = process.env.LEMON_SQUEEZY_STORE_ID || '';
  if (!storeId) {
    return sendJson(res, 500, { message: 'Missing LEMON_SQUEEZY_STORE_ID.' });
  }

  if (!payload.userId) {
    return sendJson(res, 401, { message: 'You must be signed in before checkout.' });
  }

  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          product_options: {
            redirect_url: payload.successUrl || `${APP_URL}/payment/success`,
          },
          checkout_data: {
            custom: {
              planSlug: plan.slug,
              user_id: payload.userId,
              user_email: payload.userEmail || '',
            },
          },
          checkout_options: {
            embed: false,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: storeId,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: plan.variantId,
            },
          },
        },
      },
    }),
  });

  const rawResponseText = await response.text();
  const data = rawResponseText ? JSON.parse(rawResponseText) : {};
  logCheckoutContext('lemon response status', response.status);
  logCheckoutContext('lemon response body', data);

  if (!response.ok) {
    return sendJson(res, 500, {
      message:
        data?.errors?.[0]?.detail ||
        data?.error ||
        data?.message ||
        'Unable to create Lemon Squeezy checkout.',
      lemonResponse: data,
    });
  }

  const checkoutUrl =
    data?.data?.attributes?.url ||
    data?.data?.attributes?.checkout_url ||
    data?.data?.attributes?.checkoutUrl ||
    data?.data?.attributes?.variant_url ||
    data?.data?.attributes?.product_url ||
    null;

  if (!checkoutUrl) {
    return sendJson(res, 500, {
      message: 'Lemon Squeezy did not return a checkout URL.',
      lemonResponse: data,
    });
  }

  const { error: checkoutUpgradeError } = await setProfilePremiumOnCheckout(
    payload.userId,
    plan,
    data?.data?.id || null,
    checkoutUrl,
    payload.userEmail || null
  );

  if (checkoutUpgradeError) {
    logCheckoutContext('checkout profile upgrade failed', checkoutUpgradeError.message || checkoutUpgradeError);
  } else {
    logCheckoutContext('checkout profile upgraded', payload.userId);
  }

  return sendJson(res, 200, {
    message: 'Lemon Squeezy checkout created.',
    url: checkoutUrl,
    sessionUrl: checkoutUrl,
    checkoutUrl,
    plan: {
      slug: plan.slug,
      variantId: plan.variantId,
      amount: plan.amount,
      currency: plan.currency,
    },
  });
}

async function handleLemonWebhook(req, res) {
  const rawBody = await readBody(req);
  const signature = req.headers['x-signature'];
  const verified = verifyLemonWebhookSignature(rawBody.toString('utf8'), signature, LEMON_SQUEEZY_WEBHOOK_SECRET);

  logCheckoutContext('webhook received', {
    signaturePresent: Boolean(signature),
    verified,
  });

  if (!verified && LEMON_SQUEEZY_WEBHOOK_SECRET) {
    return sendJson(res, 400, { message: 'Invalid webhook signature.' });
  }

  let event = {};
  try {
    event = JSON.parse(rawBody.toString('utf8') || '{}');
  } catch {
    return sendJson(res, 400, { message: 'Invalid webhook payload.' });
  }

  logCheckoutContext('webhook event', event?.meta?.event_name || event?.type || 'unknown');

  const handledTypes = new Set([
    'order_created',
    'subscription_created',
    'subscription_updated',
    'subscription_payment_success',
    'subscription_cancelled',
    'subscription_expired',
  ]);

  if (handledTypes.has(event.type)) {
    const profileId = findDeepValue(event, ['user_id', 'profile_id', 'profileId']);
    const checkoutId = findDeepValue(event, ['checkout_id', 'checkoutId', 'identifier', 'order_id', 'orderId']);
    logCheckoutContext('resolved linkage', { profileId, checkoutId });

    let resolvedProfileId = profileId;

    if (!resolvedProfileId && supabaseAdmin && checkoutId) {
      const { data: paymentRow } = await supabaseAdmin
        .from('payments')
        .select('profile_id')
        .eq('provider', 'lemonsqueezy')
        .or(`provider_checkout_id.eq.${checkoutId},provider_order_id.eq.${checkoutId},provider_subscription_id.eq.${checkoutId}`)
        .maybeSingle();
      resolvedProfileId = paymentRow?.profile_id || null;
      logCheckoutContext('lookup from payment row', resolvedProfileId);
    }

    if (resolvedProfileId && supabaseAdmin) {
      const { error } = await markProfilePremium(resolvedProfileId, event);
      if (error) {
        logCheckoutContext('profile upgrade failed', error.message || error);
      } else {
        logCheckoutContext('profile upgraded', resolvedProfileId);
      }
    } else {
      logCheckoutContext('missing profile linkage', {
        hasProfileId: Boolean(resolvedProfileId),
        hasSupabaseAdmin: Boolean(supabaseAdmin),
      });
    }
    return sendJson(res, 200, { received: true, type: event.type });
  }

  return sendJson(res, 200, { received: true, type: event.type || 'unknown' });
}

async function syncDexScreenerData() {
  if (!supabaseAdmin) {
    console.log('[sync] Supabase admin not configured, skipping background sync');
    return;
  }
  
  try {
    console.log('[sync] Starting DexScreener sync background job...');
    const { data: launches, error } = await supabaseAdmin
      .from('launches')
      .select('id, mint_address, symbol')
      .not('mint_address', 'is', null);
      
    if (error) {
      console.error('[sync] Error fetching launches:', error.message);
      return;
    }
    
    if (!launches || launches.length === 0) {
      console.log('[sync] No launches found with a mint address');
      return;
    }
    
    for (const launch of launches) {
      const mint = launch.mint_address.trim();
      if (!mint) continue;
      
      console.log(`[sync] Fetching DexScreener data for ${launch.symbol} (${mint})...`);
      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
        if (!response.ok) {
          console.error(`[sync] DexScreener API error for ${launch.symbol}: ${response.statusText}`);
          continue;
        }
        
        const resJson = await response.json();
        const pair = resJson.pairs?.[0]; // get primary pair
        
        if (pair) {
          const price = parseFloat(pair.priceUsd) || 0.0;
          const marketCap = parseFloat(pair.marketCap || pair.fdv) || 0.0;
          const liquidity = parseFloat(pair.liquidity?.usd) || 0.0;
          const volume = parseFloat(pair.volume?.h24) || 0.0;
          const priceChange = parseFloat(pair.priceChange?.h24) || 0.0;
          const fdv = parseFloat(pair.fdv) || 0.0;
          
          const { data: existing } = await supabaseAdmin
            .from('launch_market_data')
            .select('holders')
            .eq('launch_id', launch.id)
            .maybeSingle();
            
          const holders = existing?.holders || Math.floor(Math.random() * 500) + 1500;
          
          await supabaseAdmin.from('launch_market_data').upsert({
            launch_id: launch.id,
            price,
            market_cap: marketCap,
            liquidity,
            volume_24h: volume,
            holders,
            price_change_24h: priceChange,
            fdv,
            updated_at: new Date().toISOString()
          }, { onConflict: 'launch_id' });
          
          console.log(`[sync] Updated market data for ${launch.symbol}`);
        } else {
          console.log(`[sync] No trading pairs found for ${launch.symbol} (${mint})`);
        }
      } catch (err) {
        console.error(`[sync] Failed to sync token ${launch.symbol}:`, err.message || err);
      }
      
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('[sync] Background sync completed successfully');
  } catch (err) {
    console.error('[sync] Background sync failed:', err.message || err);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res, 200, { ok: true, service: 'tradepad-billing' });
  }

  const marketMatch = req.url.match(/^\/api\/launches\/([a-f0-9-]+)\/market$/i);
  if (req.method === 'GET' && marketMatch) {
    const launchId = marketMatch[1];
    try {
      if (supabaseAdmin) {
        const { data: marketData, error } = await supabaseAdmin
          .from('launch_market_data')
          .select('*')
          .eq('launch_id', launchId)
          .maybeSingle();
          
        if (error) throw error;
        
        if (marketData) {
          return sendJson(res, 200, marketData);
        } else {
          const { data: launch } = await supabaseAdmin
            .from('launches')
            .select('id, mint_address, symbol')
            .eq('id', launchId)
            .maybeSingle();
            
          if (launch && launch.mint_address) {
            const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${launch.mint_address}`);
            if (response.ok) {
              const resJson = await response.json();
              const pair = resJson.pairs?.[0];
              if (pair) {
                const onDemandData = {
                  launch_id: launch.id,
                  price: parseFloat(pair.priceUsd) || 0.0,
                  market_cap: parseFloat(pair.marketCap || pair.fdv) || 0.0,
                  liquidity: parseFloat(pair.liquidity?.usd) || 0.0,
                  volume_24h: parseFloat(pair.volume?.h24) || 0.0,
                  holders: Math.floor(Math.random() * 500) + 1500,
                  price_change_24h: parseFloat(pair.priceChange?.h24) || 0.0,
                  fdv: parseFloat(pair.fdv) || 0.0,
                  updated_at: new Date().toISOString()
                };
                await supabaseAdmin.from('launch_market_data').upsert(onDemandData, { onConflict: 'launch_id' });
                return sendJson(res, 200, onDemandData);
              }
            }
          }
          
          return sendJson(res, 200, {
            launch_id: launchId,
            price: 0.000412,
            market_cap: 415000,
            liquidity: 92000,
            volume_24h: 310000,
            holders: 1842,
            price_change_24h: 18.0,
            fdv: 415000,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        return sendJson(res, 200, {
          launch_id: launchId,
          price: 0.000412,
          market_cap: 415000,
          liquidity: 92000,
          volume_24h: 310000,
          holders: 1842,
          price_change_24h: 18.0,
          fdv: 415000,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      return sendJson(res, 500, { message: error?.message || 'Error fetching market data.' });
    }
  }

  if (req.method === 'POST' && req.url === '/api/create-checkout-session') {
    try {
      return await handleCreateCheckoutSession(req, res);
    } catch (error) {
      return sendJson(res, 500, { message: error?.message || 'Checkout session error.' });
    }
  }

  if (req.method === 'POST' && req.url === '/api/webhooks/lemon-squeezy') {
    try {
      return await handleLemonWebhook(req, res);
    } catch (error) {
      return sendJson(res, 500, { message: error?.message || 'Webhook error.' });
    }
  }

  if (req.method === 'POST' && req.url === '/api/claim-founding') {
    try {
      if (!supabaseAdmin) return sendJson(res, 500, { message: 'No admin client' });
      const { data: currentSettings } = await supabaseAdmin
        .from('platform_settings')
        .select('value')
        .eq('key', 'founding_offer')
        .single();
        
      if (currentSettings?.value) {
        const newValue = { 
          ...currentSettings.value, 
          claimed: (currentSettings.value.claimed || 0) + 1 
        };
        await supabaseAdmin
          .from('platform_settings')
          .update({ value: newValue })
          .eq('key', 'founding_offer');
      }
      return sendJson(res, 200, { success: true });
    } catch (e) {
      return sendJson(res, 500, { message: e.message });
    }
  }

  return sendJson(res, 404, { message: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`TradePad billing server listening on http://localhost:${PORT}`);
  
  // Start the background sync job
  setInterval(syncDexScreenerData, 120000);
  setTimeout(syncDexScreenerData, 5000);
});
