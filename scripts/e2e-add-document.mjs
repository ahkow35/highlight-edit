// E2E for the Add Document flow: admin uploads a highlighted .docx → it's tokenised + saved →
// appears as a fillable template → fill + generate → verify the downloaded doc → cleanup.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import PizZip from 'pizzip';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FIXTURE = new URL('../src/lib/merge/__fixtures__/highlighted.docx', import.meta.url).pathname;

let ok = true, id;
const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

try {
  // login
  await page.goto(`${BASE}/login`);
  await page.fill('input[type=email]', process.env.ADMIN_EMAIL || 'nyan@withkinna.com');
  await page.fill('input[type=password]', ADMIN_PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  console.log('PASS  admin login');

  // add-document page → upload highlighted fixture
  await page.goto(`${BASE}/admin/templates/new`);
  await page.setInputFiles('input[type=file]', FIXTURE);
  await page.waitForSelector('text=Detected fields (3)', { timeout: 15000 });
  console.log('PASS  3 highlights detected client-side');

  await page.locator('input:not([type=file])').first().fill('E2E Test Letter'); // the Title field
  await page.click('text=Save document');
  await page.waitForURL(/\/t\//, { timeout: 15000 });
  id = page.url().split('/t/')[1];
  console.log(`PASS  saved + redirected to fill page (id ${id})`);

  // fill the 3 fields (text inputs) and generate
  const inputs = page.locator('form input');
  await inputs.nth(0).fill('Alice Tan');
  await inputs.nth(1).fill('Manager');
  await inputs.nth(2).fill('5000');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    page.click('text=Generate .docx'),
  ]);
  const path = await download.path();
  console.log(`PASS  generated download: ${download.suggestedFilename()}`);

  // verify the downloaded doc content
  const xml = new PizZip(readFileSync(path)).file('word/document.xml').asText();
  const text = (xml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || []).map((t) => t.replace(/<[^>]+>/g, '')).join('');
  const checks = ['Dear Alice Tan,', 'Manager', 'S$5000'];
  for (const c of checks) {
    if (text.includes(c)) console.log(`PASS  output contains "${c}"`);
    else { ok = false; console.log(`FAIL  output missing "${c}"`); }
  }
  if (/\{field_\d\}/.test(text)) { ok = false; console.log('FAIL  unresolved tokens remain'); }
} catch (e) {
  ok = false;
  console.log('FAIL  ' + (e?.message || e));
  if (errs.length) console.log('  page errors: ' + errs.join(' | '));
} finally {
  if (id) await page.request.delete(`${BASE}/api/admin/templates/${id}`).then(() => console.log('PASS  cleanup deleted template')).catch(() => {});
  await browser.close();
}
console.log(ok ? 'RESULT: PASS' : 'RESULT: FAIL');
process.exit(ok ? 0 : 1);
