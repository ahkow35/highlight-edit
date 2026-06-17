'use client';

import { createClient as createJsClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/**
 * Non-PKCE (implicit) client used ONLY to send password-reset emails. Implicit links deliver the
 * recovery session as URL-hash tokens (#access_token=…), which work cross-device/browser — unlike
 * PKCE's ?code= links that require the same-browser code verifier. Custom email templates aren't
 * available on free-tier email, so controlling the flow at send-time is how we avoid the verifier.
 */
export function createRecoveryClient() {
  return createJsClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { flowType: 'implicit', persistSession: false, detectSessionInUrl: false },
  });
}
