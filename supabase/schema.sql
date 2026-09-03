create table if not exists public.application_batches (
  id uuid primary key,
  receipt_number text not null unique,
  applicant_count integer not null check (applicant_count between 1 and 20),
  status text not null default 'received',
  email_status text not null default 'pending',
  email_id text,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.business_cards (
  id uuid primary key,
  batch_id uuid not null references public.application_batches(id) on delete cascade,
  name_ko text not null,
  name_en text not null,
  position text not null,
  division text not null,
  team text not null,
  extension text not null default '',
  mobile text not null,
  email text not null
);

create index if not exists application_batches_created_at_idx
  on public.application_batches (created_at desc);
create index if not exists business_cards_batch_id_idx
  on public.business_cards (batch_id);

alter table public.application_batches enable row level security;
alter table public.business_cards enable row level security;

revoke all on public.application_batches from anon, authenticated;
revoke all on public.business_cards from anon, authenticated;
grant select on public.application_batches to authenticated;
grant select on public.business_cards to authenticated;

drop policy if exists "Admin can view application batches" on public.application_batches;
create policy "Admin can view application batches"
  on public.application_batches
  for select
  to authenticated
  using (lower(auth.jwt() ->> 'email') = 'kenneth.shin@mistobrand.com');

drop policy if exists "Admin can view business cards" on public.business_cards;
create policy "Admin can view business cards"
  on public.business_cards
  for select
  to authenticated
  using (lower(auth.jwt() ->> 'email') = 'kenneth.shin@mistobrand.com');
