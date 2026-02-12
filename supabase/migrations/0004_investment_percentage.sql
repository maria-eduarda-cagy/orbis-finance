alter table public.user_investment_settings
  add column if not exists monthly_percentage integer not null default 0;
