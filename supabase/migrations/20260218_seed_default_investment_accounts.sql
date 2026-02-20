insert into public.investment_accounts (name, type, current_balance)
values
  ('ETF Account', 'etf', 0),
  ('Crypto Account', 'crypto', 0),
  ('Cash Buffer', 'cash', 0)
on conflict (name) do nothing;

insert into public.investment_targets (name, account_id, target_percent)
select 'ETF Target', ia.id, 70
from public.investment_accounts ia
where ia.name = 'ETF Account'
and not exists (
  select 1 from public.investment_targets t where t.account_id = ia.id
);

insert into public.investment_targets (name, account_id, target_percent)
select 'Crypto Target', ia.id, 30
from public.investment_accounts ia
where ia.name = 'Crypto Account'
and not exists (
  select 1 from public.investment_targets t where t.account_id = ia.id
);
