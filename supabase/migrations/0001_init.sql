create table if not exists public.user_notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  telegram_chat_id text,
  enabled boolean not null default false,
  notify_days_before integer not null default 3
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  due_day integer not null check (due_day between 1 and 31)
);

create unique index if not exists cards_user_name_idx on public.cards(user_id, name);

create table if not exists public.income_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric not null,
  day_of_month integer not null check (day_of_month between 1 and 31),
  active boolean not null default true
);

create table if not exists public.bill_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric not null,
  day_of_month integer not null check (day_of_month between 1 and 31),
  category text,
  active boolean not null default true
);

create table if not exists public.card_statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  statement_month text not null,
  due_date date not null,
  amount_total numeric not null,
  status text not null default 'open' check (status in ('open','paid')),
  paid_at timestamptz,
  snooze_until date
);

create unique index if not exists card_statements_unique on public.card_statements(user_id, card_id, statement_month);

create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  entity_id uuid not null,
  notify_days_before integer not null,
  sent_at timestamptz not null default now()
);

alter table public.user_notification_settings enable row level security;
alter table public.cards enable row level security;
alter table public.income_rules enable row level security;
alter table public.bill_rules enable row level security;
alter table public.card_statements enable row level security;
alter table public.notification_log enable row level security;

create policy user_notification_settings_select on public.user_notification_settings
  for select using (user_id = auth.uid());
create policy user_notification_settings_upsert on public.user_notification_settings
  for insert with check (user_id = auth.uid());
create policy user_notification_settings_update on public.user_notification_settings
  for update using (user_id = auth.uid());

create policy cards_select on public.cards for select using (user_id = auth.uid());
create policy cards_insert on public.cards for insert with check (user_id = auth.uid());
create policy cards_update on public.cards for update using (user_id = auth.uid());
create policy cards_delete on public.cards for delete using (user_id = auth.uid());

create policy income_rules_select on public.income_rules for select using (user_id = auth.uid());
create policy income_rules_insert on public.income_rules for insert with check (user_id = auth.uid());
create policy income_rules_update on public.income_rules for update using (user_id = auth.uid());
create policy income_rules_delete on public.income_rules for delete using (user_id = auth.uid());

create policy bill_rules_select on public.bill_rules for select using (user_id = auth.uid());
create policy bill_rules_insert on public.bill_rules for insert with check (user_id = auth.uid());
create policy bill_rules_update on public.bill_rules for update using (user_id = auth.uid());
create policy bill_rules_delete on public.bill_rules for delete using (user_id = auth.uid());

create policy card_statements_select on public.card_statements for select using (user_id = auth.uid());
create policy card_statements_insert on public.card_statements for insert with check (user_id = auth.uid());
create policy card_statements_update on public.card_statements for update using (user_id = auth.uid());
create policy card_statements_delete on public.card_statements for delete using (user_id = auth.uid());

create policy notification_log_select on public.notification_log for select using (user_id = auth.uid());
create policy notification_log_insert on public.notification_log for insert with check (user_id = auth.uid());
create policy notification_log_update on public.notification_log for update using (user_id = auth.uid());
create policy notification_log_delete on public.notification_log for delete using (user_id = auth.uid());

create or replace function public.set_user_id()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

create trigger set_user_id_user_notification_settings
before insert on public.user_notification_settings
for each row execute function public.set_user_id();

create trigger set_user_id_cards
before insert on public.cards
for each row execute function public.set_user_id();

create trigger set_user_id_income_rules
before insert on public.income_rules
for each row execute function public.set_user_id();

create trigger set_user_id_bill_rules
before insert on public.bill_rules
for each row execute function public.set_user_id();

create trigger set_user_id_card_statements
before insert on public.card_statements
for each row execute function public.set_user_id();

create trigger set_user_id_notification_log
before insert on public.notification_log
for each row execute function public.set_user_id();
