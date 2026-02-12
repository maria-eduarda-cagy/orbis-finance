create table if not exists public.user_investment_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_amount numeric not null default 0
);

alter table public.user_investment_settings enable row level security;

create policy user_investment_settings_select on public.user_investment_settings
  for select using (user_id = auth.uid());
create policy user_investment_settings_upsert on public.user_investment_settings
  for insert with check (user_id = auth.uid());
create policy user_investment_settings_update on public.user_investment_settings
  for update using (user_id = auth.uid());

create trigger set_user_id_user_investment_settings
before insert on public.user_investment_settings
for each row execute function public.set_user_id();
