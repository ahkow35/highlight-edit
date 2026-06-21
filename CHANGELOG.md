# Changelog

All notable changes to Contract Manager (formerly highlight-edit).

## 2026-06-21

### Malaysia Part-Timer — now backed by LC's real .docx
- Received LC's actual Word files (15 filled Part Timer samples, one per brand).
  Confirmed all 15 share one template; tokenised the genuine `.docx` (real
  letterhead/logo/footer) and **replaced the PDF reconstruction**. Pixel-perfect now.
- Multi-paragraph address block collapses to a single `{address}` token (line breaks
  preserved). 90 tests pass.

### Contract Staff (5 brands) — built as per-brand templates
- These are **not** one template (per-brand divergence in allowances, benefits annex,
  public-holiday tables, client co-signatories), so each brand is its own tokenised
  template; only per-employee fields are filled, all brand-specific content stays fixed.
- Config-driven factory (`contract-staff.ts`): generic MY validate/tokens + the
  `{prefix}Figure→{prefix}Words` auto-fill; each brand = a field list + its `.docx`.
  - **Bvlgari**: salary + Transport/Meal/Grooming allowances, fixed-term.
  - **Chanel**: role in intro, en-dash duration, salary only, name in confirm line.
  - **Coach**: salary + one allowance (converted from `.doc` via textutil — note: that
    conversion drops LC's letterhead/logo; the other four use their real `.docx`).
  - **Givenchy**: 2 allowances, **open-ended** (no end date), LVMH co-signatory fixed.
  - **Guerlain**: initial + **post-probation** salary/allowance, open-ended.
- Fixed a tokeniser double-escaping bug (`&amp;` → `&amp;amp;`) that surfaced on
  Guerlain's "LVMH Perfumes & Cosmetics" client name.
- 96 tests pass (was 90); per-brand integration tests render each contract and assert
  brand boilerplate is intact.

### Contract Staff — follow-ups
- **Coach** re-tokenised from LC's real `.docx` (received as proper Word) — full
  letterhead/logo restored; the textutil stopgap is dropped.
- **All five now fixed-term:** Givenchy and Guerlain had no end date in LC's files, so
  inserted LC's standard "Contract Duration" clause (verbatim wording) before
  "Schedule Of Benefits"; both gained a contract end-date field.

## 2026-06-19 (later)

### Non-Local Secondment — commission now fully optional
- Added a `hasCommissionScheme` toggle wrapping the Sales Commission Scheme clause, so a
  hire with no commission gets neither the scheme nor the guarantee. The first-3-months
  guaranteed-commission toggle is now nested under it (shown only when the scheme is on),
  and the guarantee is suppressed in output if the scheme is off.
- `IntakeForm.isVisible` now follows the `showIf` chain transitively (unticking a parent
  hides the whole dependent subtree).

### Malaysia (LC Part-Timer) — unblocked
- Reconstructed a **content-faithful tokenised `.docx`** from LC's supplied PDFs
  (Sarah / Chen) — clauses 1–12, the overtime multiplier table, the Luxury Careers
  footer, and the Irene Law signatory. LC's original Word file was never provided; the
  reconstruction can be swapped for the real `.docx` if it surfaces.
- Replaced the unreliable `firstName`-derived salutation with an explicit operator
  **Salutation** field — surname-first Malaysian-Chinese names (e.g. "Chen Mei Jun" →
  "Dear Mei Jun,") can't be auto-derived. Removed `lc-part-timer-my` from the blocked list.

## 2026-06-19

### Added — two new SG contract templates
- **SG Non-Local Secondment (Outsourcing)** — basic salary plus three **optional** pay
  clauses, each a checkbox toggle that drives a docxtemplater conditional section:
  monthly travel allowance, first-3-months guaranteed commission, and a discretionary
  bonus (with a qualifying date). FIN signature line.
- **SG Internal Employee** — INWW's own staff. Fills the two `[DATE]` brackets (letter
  date + "with effect from" start date), `[salary]`, `[mobile allowance]`, and
  designation. Open-ended (no contract end date).

### Engine
- New `'checkbox'` field type; `FieldDef.showIf` to gate a field behind a checkbox;
  `TokenMap` now allows `boolean` (booleans drive `{#flag}…{/flag}` sections).
- `IntakeForm`: checkbox rendering, `showIf` field-gating, and generalised
  `{prefix}Figure → {prefix}Words` salary-in-words auto-fill (covers salary + travel).
- `runtime.ts`: `showIf`-aware generic validate/tokens for admin-uploaded templates.

### Notes
- Local Secondment unchanged — the re-supplied source `.docx` is byte-identical.
- Malaysia (LC part-timer) still **blocked**: the `lc-part-timer` module is coded and
  registered, but no official MY `.docx` has been supplied to tokenise.

### Verification
- `tsc --noEmit` clean · `eslint --quiet` clean · **81 tests** pass (was 62) ·
  production build OK. Files: `src/lib/merge/types.ts`, `runtime.ts`, `registry.ts`,
  `components/IntakeForm.tsx`, two new template modules + integration tests, two new
  tokenised `.docx` under `public/templates/`.
