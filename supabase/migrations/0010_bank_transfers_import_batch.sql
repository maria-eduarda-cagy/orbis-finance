alter table public.bank_transfers
add column if not exists import_batch_id uuid references public.bank_statement_imports(id) on delete set null;
