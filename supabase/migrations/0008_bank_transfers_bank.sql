alter table public.bank_transfers
add column if not exists bank_name text;
