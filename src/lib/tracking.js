import { supabase } from './supabase';

// Generate a random UUID/session token for correlation
let currentSessionId = sessionStorage.getItem('tradepad_session_id');
if (!currentSessionId) {
  currentSessionId = crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('tradepad_session_id', currentSessionId);
}

let logId = null;
let accumulatedSeconds = 0;
let intervalId = null;

export async function startTrackingSession(userId, email) {
  if (!supabase || !userId) return;

  // Stop any previous heartbeat tracker
  if (intervalId) clearInterval(intervalId);

  try {
    const userAgent = navigator.userAgent;
    
    // Create login snapshot in audit table
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .insert({
        user_id: userId,
        email: email,
        action_type: 'login',
        details: 'Logged in to dashboard',
        session_id: currentSessionId,
        user_agent: userAgent,
        duration_seconds: 0
      })
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (data) {
      logId = data.id;
    }

    // Heartbeat every 15 seconds to accumulate duration time
    intervalId = setInterval(async () => {
      accumulatedSeconds += 15;
      if (logId) {
        await supabase
          .from('admin_activity_logs')
          .update({
            duration_seconds: accumulatedSeconds,
            action_type: 'session_heartbeat',
            updated_at: new Date().toISOString()
          })
          .eq('id', logId);
      }
    }, 15000);

  } catch (err) {
    console.error('Session tracking error:', err);
  }
}

export async function trackUserAction(userId, email, actionType, details) {
  if (!supabase || !userId) return;
  try {
    await supabase
      .from('admin_activity_logs')
      .insert({
        user_id: userId,
        email: email,
        action_type: actionType,
        details: details,
        session_id: currentSessionId,
        user_agent: navigator.userAgent,
        duration_seconds: accumulatedSeconds
      });
  } catch (err) {
    console.error('Action tracking error:', err);
  }
}

export function stopTrackingSession() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
