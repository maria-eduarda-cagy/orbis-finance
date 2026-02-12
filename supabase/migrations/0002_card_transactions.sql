create table if not exists public.card_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  statement_month text not null,
  due_date date not null,
  purchase_date date not null,
  category text,
  description text,
  installment text,
  amount_usd numeric,
  fx_rate numeric,
  amount_brl numeric not null
);

create index if not exists card_transactions_month_idx on public.card_transactions(user_id, statement_month);
create unique index if not exists card_transactions_unique
  on public.card_transactions(user_id, card_id, purchase_date, amount_brl, description, installment);

alter table public.card_transactions enable row level security;

create policy card_transactions_select on public.card_transactions for select using (user_id = auth.uid());
create policy card_transactions_insert on public.card_transactions for insert with check (user_id = auth.uid());
create policy card_transactions_update on public.card_transactions for update using (user_id = auth.uid());
create policy card_transactions_delete on public.card_transactions for delete using (user_id = auth.uid());

create trigger set_user_id_card_transactions
before insert on public.card_transactions
for each row execute function public.set_user_id();
