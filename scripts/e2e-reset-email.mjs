// E2E for the self-service recovery flow: admin-generate a recovery link (same hash format as the
// email), open it in a browser, let the reset page consume the hash, set a new password, confirm login.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim();
const URLB = get('NEXT_PUBLIC_SUPABASE_URL');
const ANON = get('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const SR = get('SUPABASE_SERVICE_ROLE_KEY');
const TEST = 'e2e-pwreset-deleteme@example.com';
const NEWPW = 'BrandNewPw2026X';

const adminHeaders = { apikey: SR, Authorization: `Bearer ${SR}`, 'content-type': 'application/json' };
let ok = true, id;
const browser = await chromium.launch();
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

try {
  // 1. create throwaway user
  let r = await fetch(`${URLB}/auth/v1/admin/users`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({ email: TEST, password: 'InitialPw123', email_confirm: true }) });
  let j = await r.json(); id = j.id;
  if (!id) throw new Error('create failed: ' + JSON.stringify(j));
  console.log('PASS  created throwaway user');

  // 2. admin-generate a recovery link (same as the email link)
  r = await fetch(`${URLB}/auth/v1/admin/generate_link`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({ type: 'recovery', email: TEST, redirect_to: `${BASE}/reset-password` }) });
  j = await r.json();
  const link = j.action_link;
  if (!link) throw new Error('generate_link failed: ' + JSON.stringify(j));
  console.log('PASS  generated recovery link');

  // 3. open the link → verify redirects to /reset-password#access_token=… → page consumes hash
  await page.goto(link, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/reset-password/, { timeout: 20000 });
  // wait for the new-password input (phase 'ready')
  await page.waitForSelector('input[type=password]', { timeout: 20000 });
  console.log('PASS  reset page reached "ready" (hash session accepted)');

  // 4. set a new password
  await page.fill('input[type=password]', NEWPW);
  await page.click('button[type=submit]');
  await page.waitForFunction(() => document.body.innerText.includes('Password updated') || location.pathname === '/', { timeout: 20000 });
  console.log('PASS  password update submitted');

  // 5. confirm the new password logs in
  const tok = await fetch(`${URLB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' }, body: JSON.stringify({ email: TEST, password: NEWPW }) });
  const tj = await tok.json();
  if (tj.access_token) console.log('PASS  new password logs in');
  else { ok = false; console.log('FAIL  new password did not log in: ' + JSON.stringify(tj).slice(0, 200)); }
} catch (e) {
  ok = false;
  console.log('FAIL  ' + (e?.message || e));
  if (errs.length) console.log('  page errors: ' + errs.join(' | '));
} finally {
  if (id) await fetch(`${URLB}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: adminHeaders }).then(() => console.log('PASS  cleanup deleted user')).catch(() => {});
  await browser.close();
}
console.log(ok ? 'RESULT: PASS' : 'RESULT: FAIL');
process.exit(ok ? 0 : 1);
