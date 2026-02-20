-- Restore API role access for finance app tables + RPCs.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.months to anon, authenticated, service_role;
grant select, insert, update, delete on table public.transactions to anon, authenticated, service_role;
grant select, insert, update, delete on table public.bills to anon, authenticated, service_role;
grant select, insert, update, delete on table public.categories to anon, authenticated, service_role;
grant select, insert, update, delete on table public.investment_accounts to anon, authenticated, service_role;
grant select, insert, update, delete on table public.investment_targets to anon, authenticated, service_role;
grant select, insert, update, delete on table public.investment_contributions to anon, authenticated, service_role;
grant select, insert, update, delete on table public.investment_moves to anon, authenticated, service_role;

grant execute on function public.get_bills_due_before_payday(uuid, date) to anon, authenticated, service_role;
grant execute on function public.get_dashboard_snapshot(uuid) to anon, authenticated, service_role;
grant execute on function public.apply_salary_received(uuid, boolean, date) to anon, authenticated, service_role;
grant execute on function public.rollover_recurring_bills(uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.apply_investment_contribution(uuid, numeric, date, jsonb) to anon, authenticated, service_role;

alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
