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
  id uuid primary key default gen_random_uuid(),
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

create or replace function public.submit_business_card_application(
  p_batch_id uuid,
  p_receipt_number text,
  p_created_at timestamptz,
  p_applicants jsonb
)
returns table (receipt_number text, email_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  applicant_total integer := jsonb_array_length(p_applicants);
begin
  if applicant_total < 1 or applicant_total > 20 then
    raise exception 'Applicant count must be between 1 and 20';
  end if;

  insert into public.application_batches (
    id,
    receipt_number,
    applicant_count,
    created_at
  )
  values (
    p_batch_id,
    p_receipt_number,
    applicant_total,
    p_created_at
  )
  on conflict (id) do nothing;

  if not exists (
    select 1 from public.business_cards where batch_id = p_batch_id
  ) then
    insert into public.business_cards (
      batch_id,
      name_ko,
      name_en,
      position,
      division,
      team,
      extension,
      mobile,
      email
    )
    select
      p_batch_id,
      trim(applicant ->> 'nameKo'),
      trim(applicant ->> 'nameEn'),
      trim(applicant ->> 'position'),
      trim(applicant ->> 'division'),
      trim(applicant ->> 'team'),
      coalesce(trim(applicant ->> 'extension'), ''),
      trim(applicant ->> 'mobile'),
      trim(applicant ->> 'email')
    from jsonb_array_elements(p_applicants) as applicant;
  end if;

  return query
  select batch.receipt_number, batch.email_status
  from public.application_batches as batch
  where batch.id = p_batch_id;
end;
$$;

revoke all on function public.submit_business_card_application(uuid, text, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_business_card_application(uuid, text, timestamptz, jsonb)
  to service_role;
