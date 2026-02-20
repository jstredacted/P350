alter function public.set_updated_at() set search_path = public;
alter function public.get_bills_due_before_payday(uuid, date) set search_path = public;
alter function public.get_dashboard_snapshot(uuid) set search_path = public;
alter function public.apply_salary_received(uuid, boolean, date) set search_path = public;
alter function public.rollover_recurring_bills(uuid, uuid) set search_path = public;
