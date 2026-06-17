# PDPA Compliance Audit & Sign-Off — Contract Manager

| | |
|---|---|
| **System** | Contract Manager (`contract-manager-suite.vercel.app`) |
| **Owner** | INWorldwide Pte Ltd / With Kinna (Nyan Yuen Keong) |
| **Purpose** | Generate HR documents (employment contracts, letters) containing employee personal data |
| **Governing law** | Singapore PDPA 2012; Malaysia PDPA 2010 (for MY templates) |
| **Audit date** | 2026-06-18 |
| **Audited commit** | `main` @ Contract Manager rebuild (Next.js / Supabase / Vercel) |
| **Auditor** | Engineering (automated verification) — countersigned by Owner below |

---

## 1. Scope

This audit covers how the application handles **personal data of the employees whose documents are generated** (the data subjects): full name, NRIC/MyKad, residential address, salary, and ID-card images. It also covers **staff account data** (the WK/INWW operators who log in).

The controlling design principle (the "PDPA invariants") is that **employee personal data is processed entirely in the operator's browser and never transmitted to or stored on any server.** WK/INWW acts as a data intermediary (processor) for its clients; keeping subject data client-side removes cross-border transfer and sub-processing exposure (PDPA ss. 26/129 considerations).

---

## 2. Data classification & flow

| Data | Class | Where processed | Where stored | Crosses a server? |
|---|---|---|---|---|
| Employee full name, NRIC, address, salary, dates | Subject PII | Browser only | Not stored | **No** |
| ID-card image + OCR text | Subject PII | Browser (Tesseract.js, on-device) | Not stored | **No** |
| Generated `.docx` document | Subject PII | Browser (docxtemplater) | Not stored — client download | **No** |
| Blank document templates | No PII | — | Supabase (`templates`, base64) | Yes (no PII) |
| Staff email + hashed password | Staff PII | Supabase Auth | Supabase (SG region) | Yes |
| Usage events (template id, user id/email, timestamp) | Staff metadata | Vercel function | Supabase (`usage_events`) | Yes (no subject PII) |

**Conclusion:** No subject-employee personal data crosses the application boundary. Only staff account data and non-PII template/usage metadata reach the server tier.

---

## 3. The five invariants — verification

| # | Invariant | Verification | Result |
|---|---|---|---|
| INV-1 | Subject PII never leaves the browser | Code audit of every `fetch`/route handler — the only network call from the fill flow is fetching a **blank** template and a metadata-only `POST /api/usage` (`{templateId}` only). Filled values, NRIC, images, generated docs are never sent. Live DevTools network review on the contract flow. | **PASS** |
| INV-2 | Server stores only blank templates + accounts | DB schema: `templates` (blank base64), `usage_events` (ids + timestamp), Supabase Auth users. No table holds filled field values. | **PASS** |
| INV-3 | No server-side draft storage | The old app's `TemplateDraft` table (which stored filled values incl. NRIC) was deleted in the rebuild and not reintroduced. No draft persistence exists. | **PASS** |
| INV-4 | OCR runs on-device | Tesseract.js worker + WASM core + language data are served **same-origin** from `/ocr` (no CDN). pdf.js worker likewise. Verified 0 off-origin requests in a headless-Chromium run; the card image is never uploaded. | **PASS** |
| INV-5 | Generated document is a client-side download | `docxtemplater` renders in-browser to a `Blob`; download via an object URL. No server round-trip. | **PASS** |

Automated evidence: unit + integration tests (`npx vitest run`) and end-to-end Playwright runs of the contract fill, OCR (image + PDF), admin, and reset flows. The OCR self-test confirmed same-origin loading with zero off-origin requests.

---

## 4. Access control & security

- **Authentication:** Supabase email/password; all app routes gated by middleware (unauthenticated → `/login`).
- **Authorisation:** admin/staff roles in Supabase `app_metadata` (server-set only). Admin APIs enforce `role === 'admin'` server-side; `/admin` is additionally gated at the edge.
- **Service-role key** is server-only (never `NEXT_PUBLIC`, `import 'server-only'` enforced); confirmed never committed to git.
- **Password policy:** minimum 8 characters, requires lower-case, upper-case, and digit (Supabase Auth).
- **Independent security review** (2026-06-17) found no critical issues; the one flagged "critical" (service-role key exposure) was disproven — the key was never committed and is git-ignored. Hardening applied: server-verified password recovery, edge-level admin gating, usage-id validation against the template registry.

---

## 5. Third-party processors

| Processor | Role | Region | Data handled |
|---|---|---|---|
| Supabase | Auth + database | **Singapore** (`ap-southeast-1`) | Staff accounts, blank templates, usage metadata |
| Vercel | Hosting + serverless functions | Function region (US East at audit time) | Auth cookies, staff email, usage metadata, blank templates — **no subject PII** |

Note: staff account data (emails) transit Vercel functions (US region). This is a transfer of **staff** personal data only; staff are internal users of the tool. Subject-employee PII never reaches Vercel or Supabase. If staff-data residency in-region is later required, Vercel function region can be pinned to Singapore.

---

## 6. Residual risks & accepted items

- **Email delivery** uses Supabase's built-in (rate-limited) provider — accepted for current low user count (3–4 staff). Custom SMTP recommended before scaling.
- **Admin-created temp passwords** are shown once in the admin UI over HTTPS — accepted operational tradeoff; admin-initiated reset avoids emailing credentials.
- **OCR accuracy** is assistive only; every field is operator-verified before generation. OCR is never authoritative.
- **Uploaded ("Add Document") templates** must be confirmed PII-free by the admin before saving (the app stores them as blank templates).

---

## 7. Sign-off

The application, as audited, processes employee personal data entirely client-side and does not store or transmit it to any server. The five PDPA invariants are verified to hold. Outstanding items are limited to the accepted operational tradeoffs in §6.

| Role | Name | Signature | Date |
|---|---|---|---|
| Engineering (verification) | Automated audit | ✓ verified by test + code review | 2026-06-18 |
| Data owner / approver | Nyan Yuen Keong | __________________ | __________ |
