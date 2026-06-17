-- User-added document templates (the "Add document" feature). The tokenised BLANK .docx is stored
-- base64 here (no PII — it's a blank template). Fill/generate still happens entirely in the browser.
create table if not exists public.templates (
  id               text primary key,
  title            text not null,
  jurisdiction     text not null default 'NONE',
  fields           jsonb not null default '[]'::jsonb,
  docx_b64         text not null,
  ocr              boolean not null default false,
  filename_pattern text,
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists templates_created_at_idx on public.templates (created_at desc);

alter table public.templates enable row level security;
-- No policies: only the Next.js server (service_role) reads/writes. Clients go through admin/auth-gated APIs.
