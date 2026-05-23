-- Infra performance pass:
-- 1) Ensure updated_at triggers are installed.
-- 2) Add composite indexes used by dashboard/list queries.
-- 3) Collapse contribution+moves+balance updates into one atomic RPC.

do $$
declare
  table_name text;
  trigger_name text;
begin
  foreach table_name in array array[
    'months',
    'transactions',
    'bills',
    'investment_accounts',
    'investment_targets',
    'investment_contributions'
  ]
  loop
    trigger_name := 'set_' || table_name || '_updated_at';

    if not exists (
      select 1
      from pg_trigger t
      where t.tgname = trigger_name
      and t.tgrelid = format('public.%I', table_name)::regclass
      and not t.tgisinternal
    ) then
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
        trigger_name,
        table_name
      );
    end if;
  end loop;
end
$$;

create index if not exists transactions_month_date_desc_idx
on public.transactions(month_id, date desc);

create index if not exists bills_month_paid_due_idx
on public.bills(month_id, paid, due_date);

create index if not exists bills_month_due_idx
on public.bills(month_id, due_date);

create index if not exists investment_contributions_month_date_desc_idx
on public.investment_contributions(month_id, date desc);

create or replace function public.apply_investment_contribution(
  p_month_id uuid,
  p_total_amount numeric,
  p_date date,
  p_moves jsonb default '[]'::jsonb
)
returns public.investment_contributions
language plpgsql
as $$
declare
  inserted public.investment_contributions;
begin
  if p_month_id is null then
    raise exception 'month_id_required';
  end if;

  if p_total_amount is null or p_total_amount <= 0 then
    raise exception 'invalid_total_amount';
  end if;

  if not exists (select 1 from public.months m where m.id = p_month_id) then
    raise exception 'month_not_found';
  end if;

  insert into public.investment_contributions (month_id, total_amount, date)
  values (p_month_id, p_total_amount, p_date)
  returning * into inserted;

  if jsonb_typeof(coalesce(p_moves, '[]'::jsonb)) = 'array'
     and jsonb_array_length(coalesce(p_moves, '[]'::jsonb)) > 0 then
    with move_rows as (
      select
        (entry->>'account_id')::uuid as account_id,
        round((entry->>'amount')::numeric, 2) as amount
      from jsonb_array_elements(p_moves) as entry
      where (entry->>'account_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and (entry->>'amount') ~ '^-?[0-9]+(\.[0-9]+)?$'
      and (entry->>'amount')::numeric > 0
    ),
    inserted_moves as (
      insert into public.investment_moves (contribution_id, account_id, amount)
      select inserted.id, mr.account_id, mr.amount
      from move_rows mr
      where exists (
        select 1
        from public.investment_accounts ia
        where ia.id = mr.account_id
      )
      returning account_id, amount
    ),
    aggregated as (
      select account_id, sum(amount) as amount
      from inserted_moves
      group by account_id
    )
    update public.investment_accounts ia
    set current_balance = ia.current_balance + aggregated.amount
    from aggregated
    where ia.id = aggregated.account_id;
  end if;

  return inserted;
end;
$$;

alter function public.apply_investment_contribution(uuid, numeric, date, jsonb) set search_path = public;
