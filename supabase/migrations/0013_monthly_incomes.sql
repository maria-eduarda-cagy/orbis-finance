create table if not exists public.monthly_incomes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text,
  category text,
  amount numeric not null,
  month text not null,
  day_of_month integer
);

alter table public.monthly_incomes enable row level security;

create policy monthly_incomes_select on public.monthly_incomes
for select using (user_id = auth.uid());

create policy monthly_incomes_insert on public.monthly_incomes
for insert with check (user_id = auth.uid());

create policy monthly_incomes_update on public.monthly_incomes
for update using (user_id = auth.uid());

create policy monthly_incomes_delete on public.monthly_incomes
for delete using (user_id = auth.uid());
