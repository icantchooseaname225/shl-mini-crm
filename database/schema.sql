-- Mini CRM leads table for Supabase PostgreSQL.
create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  email text not null check (char_length(trim(email)) between 3 and 254),
  phone text not null check (char_length(trim(phone)) between 1 and 30),
  business_name text not null check (char_length(trim(business_name)) between 1 and 120),
  status text not null default 'New' check (status in ('New', 'Contacted', 'Converted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

-- The browser has no direct database access. The Netlify Function uses the
-- service-role key on the server, which bypasses RLS; no anon policies exist.
alter table public.leads enable row level security;
revoke all on table public.leads from anon, authenticated;
