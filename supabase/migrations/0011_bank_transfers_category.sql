alter table public.bank_transfers
add column if not exists category text;
