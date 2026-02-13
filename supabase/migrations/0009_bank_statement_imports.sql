create table if not exists public.bank_statement_imports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  bank text not null,
  statement_month text not null,
  file_name text,
  created_at timestamptz default now()
);

alter table public.bank_statement_imports enable row level security;

create policy bank_statement_imports_select on public.bank_statement_imports
for select using (user_id = auth.uid());

create policy bank_statement_imports_insert on public.bank_statement_imports
for insert with check (user_id = auth.uid());

create policy bank_statement_imports_delete on public.bank_statement_imports
for delete using (user_id = auth.uid());
