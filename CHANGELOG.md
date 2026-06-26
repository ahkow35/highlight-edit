# Changelog

All notable changes to Contract Manager (formerly highlight-edit).

## 2026-06-27 — LC Contract Staff: operator feedback round

Applied the operator's feedback to all 5 LC Malaysia Contract Staff brand templates,
in two phases (`feat/lc-contract-staff-updates`).

**Phase A — schema (`contract-staff.ts`):** added operator-editable `probationMonths`,
`noticeProbation`, `noticeAfterProbation` fields to every brand via a shared `probation()`
helper. `probationMonths` pre-fills per brand (Bvlgari/Givenchy 3, Coach 6; Chanel/Guerlain
blank). The generic factory auto-wires the tokens.

**Phase B — templates (.docx):**
- **Bold** Contract Start/End Date, Position, Salary, and Allowance values (run-split so only
  the value bolds, not the sentence).
- **Probation** period tokenised to `{probationMonths}` (Bvlgari/Coach/Givenchy; Chanel/Guerlain
  have no fixed-term clause so stay blank).
- **Confirmation** statement → "I, {name}, confirm…" (Bvlgari/Coach/Guerlain; Chanel/Givenchy
  already carried it).
- **Coach footer** updated to the new registered address (Menara AIA Sentral); the other four
  brands already had it.
- **Address** paragraph forced to single line-spacing — fixes the over-large gaps between
  address lines reported in Word.

**Deferred (per operator):** the annual-leave clause + full-time toggle, and tokenising the
termination-notice periods (a weeks→months change that needs an HR-law check). The
`noticeProbation`/`noticeAfterProbation` fields exist in the form but are not yet printed.

Verification: `tsc` clean, 98 tests pass, structural checks confirm every change landed.
Bold/line-spacing are not test-visible — sample contracts (Bvlgari, Coach) generated for a
Word eyeball before merge.

## 2026-06-21 (later) — MyKad OCR: full address extraction

Building on the binarisation fix — the middle address rows ("TAMAN BUKIT MEWAH",
"43000 KAJANG") were still being garbled or dropped. Three changes get the whole address:

- **`preprocess.ts`:** crop to the card's dark-content bounding box (drops the white scan
  margins so the print isn't shrunk by the surrounding page) and upscale to a working width
  before Sauvola — small middle-row text now resolves.
- **`recognize.ts` / `OcrPanel`:** the MyKad is read with **two** page-segmentation passes
  (PSM 4 + PSM 6) and merged — they capture complementary rows of the card.
- **`extract.ts`:** the MyKad address is now **assembled by row** (street → locality →
  postcode → state) and emitted in canonical order regardless of OCR line order, with
  chrome words and lower-case OCR noise stripped per row.
- Verified end-to-end in a real browser on an actual MyKad: address extracts cleanly as
  `NO 38A JALAN 72 / TAMAN BUKIT MEWAH / 43000 KAJANG / SELANGOR`. (Name still surfaces the
  given names but loses the first letter of the surname, and the NRIC's leading digits can
  misread — both flagged for operator correction; OCR stays assist-only.)

## 2026-06-21 (later) — Contract Staff allowance defaults

- Each Contract Staff brand now **pre-fills its standard allowance amounts** (figure +
  words) from the brand's template, so the operator only edits exceptions: Bvlgari
  Transport/Meal RM200, Grooming RM100; Coach RM100; Givenchy Travelling RM500,
  Grooming RM100; Guerlain Travelling RM400, post-probation RM600. Salary stays blank
  (negotiated per hire).
- `IntakeForm` words auto-fill now re-derives when an allowance figure is changed (it
  previously skipped any field that already had a value, i.e. a default), while still
  never clobbering hand-edited words.

## 2026-06-21 (later) — MyKad OCR fix

The MyKad's holographic security background was defeating Tesseract entirely (raw OCR
returned pure noise). The dark text separates in the blue channel, so:

- **`preprocess.ts` (new):** client-side blue-channel **Sauvola adaptive binarisation**
  (per-pixel local threshold via integral images) — removes the busy background while
  coping with the card's large photo and uneven lighting, where a global threshold fails.
  Scoped to MY (SG NRIC reads fine untouched). Runs on a canvas; nothing leaves the browser.
- **`recognize.ts`:** optional page-segmentation mode; MyKad uses PSM 4 (single column).
- **`extract.ts`:** MyKad has no "Address:" label, so address is gathered by street/postcode/
  state keywords with card-chrome words stripped; and the name is taken from the line below
  the ID number (so the garbled "IDENTITY CARD" title block can't win the name scoring).
- Verified end-to-end in a real browser (canvas + Tesseract.js) against an actual MyKad:
  name, street line, and most of the NRIC now extract where there was previously only noise.
  Unit test added with the real binarised OCR text. OCR remains assist-only — operator verifies.

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
