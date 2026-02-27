create table if not exists public.user_card_mode (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mode text not null default 'import' check (mode in ('import','total_only')),
  updated_at timestamp with time zone default now()
);

alter table public.user_card_mode enable row level security;

create policy user_card_mode_select on public.user_card_mode
for select using (user_id = auth.uid());

create policy user_card_mode_upsert on public.user_card_mode
for insert with check (user_id = auth.uid());

create policy user_card_mode_update on public.user_card_mode
for update using (user_id = auth.uid());
