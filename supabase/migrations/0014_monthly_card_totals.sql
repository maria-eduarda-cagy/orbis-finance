create table if not exists public.monthly_card_totals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_name text not null,
  amount_total numeric not null,
  statement_month text not null,
  created_at timestamp with time zone default now()
);

create unique index if not exists monthly_card_totals_unique
  on public.monthly_card_totals(user_id, card_name, statement_month);

alter table public.monthly_card_totals enable row level security;

create policy monthly_card_totals_select on public.monthly_card_totals
for select using (user_id = auth.uid());

create policy monthly_card_totals_insert on public.monthly_card_totals
for insert with check (user_id = auth.uid());

create policy monthly_card_totals_update on public.monthly_card_totals
for update using (user_id = auth.uid());

create policy monthly_card_totals_delete on public.monthly_card_totals
for delete using (user_id = auth.uid());
