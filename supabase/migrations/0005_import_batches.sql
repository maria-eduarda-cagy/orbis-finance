create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  statement_month text not null,
  due_date date not null,
  bank text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

alter table public.import_batches enable row level security;

create policy import_batches_select on public.import_batches
  for select using (user_id = auth.uid());
create policy import_batches_insert on public.import_batches
  for insert with check (user_id = auth.uid());
create policy import_batches_delete on public.import_batches
  for delete using (user_id = auth.uid());

create trigger set_user_id_import_batches
before insert on public.import_batches
for each row execute function public.set_user_id();

alter table public.card_statements
  add column if not exists import_batch_id uuid references public.import_batches(id) on delete set null;

alter table public.card_transactions
  add column if not exists import_batch_id uuid references public.import_batches(id) on delete set null;
