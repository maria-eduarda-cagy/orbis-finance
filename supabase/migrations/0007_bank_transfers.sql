create table if not exists public.bank_transfers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text,
  amount numeric not null,
  transfer_date date not null,
  transfer_month text not null,
  direction text not null
);

alter table public.bank_transfers enable row level security;

create policy bank_transfers_select on public.bank_transfers
for select using (user_id = auth.uid());

create policy bank_transfers_insert on public.bank_transfers
for insert with check (user_id = auth.uid());

create policy bank_transfers_update on public.bank_transfers
for update using (user_id = auth.uid());

create policy bank_transfers_delete on public.bank_transfers
for delete using (user_id = auth.uid());
