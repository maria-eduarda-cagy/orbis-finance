create table if not exists public.variable_expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text,
  category text,
  amount numeric not null,
  month text not null,
  day_of_month integer
);

alter table public.variable_expenses enable row level security;

create policy variable_expenses_select on public.variable_expenses
for select using (user_id = auth.uid());

create policy variable_expenses_insert on public.variable_expenses
for insert with check (user_id = auth.uid());

create policy variable_expenses_update on public.variable_expenses
for update using (user_id = auth.uid());

create policy variable_expenses_delete on public.variable_expenses
for delete using (user_id = auth.uid());
