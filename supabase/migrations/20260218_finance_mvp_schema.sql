-- Applied via Supabase MCP: finance_mvp_schema_and_rpcs
create extension if not exists pgcrypto;

create table if not exists public.months (
  id uuid primary key default gen_random_uuid(),
  year int not null check (year >= 2000 and year <= 3000),
  month int not null check (month between 1 and 12),
  starting_cash numeric(14,2) not null default 0 check (starting_cash >= 0),
  budget_limit numeric(14,2) not null default 0 check (budget_limit >= 0),
  expected_salary numeric(14,2) not null default 0 check (expected_salary >= 0),
  payday_date date,
  salary_received boolean not null default false,
  salary_received_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (year, month)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_budget numeric(14,2) not null default 0 check (default_budget >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.months(id) on delete cascade,
  date date not null,
  amount numeric(14,2) not null check (amount > 0),
  type text not null check (type in ('expense', 'income', 'investment', 'transfer')),
  category_id uuid references public.categories(id) on delete set null,
  notes text,
  source text,
  source_ref uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists transactions_salary_source_ref_uniq
on public.transactions(source, source_ref)
where source = 'salary' and source_ref is not null;

create index if not exists transactions_month_id_idx on public.transactions(month_id);
create index if not exists transactions_type_idx on public.transactions(type);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(14,2) not null check (amount >= 0),
  due_date date not null,
  month_id uuid not null references public.months(id) on delete cascade,
  paid boolean not null default false,
  paid_date date,
  recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bills_month_id_idx on public.bills(month_id);
create index if not exists bills_due_date_idx on public.bills(due_date);
create index if not exists bills_paid_idx on public.bills(paid);

create table if not exists public.investment_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null,
  current_balance numeric(14,2) not null default 0 check (current_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_targets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_id uuid unique references public.investment_accounts(id) on delete cascade,
  target_percent numeric(5,2) not null check (target_percent >= 0 and target_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_contributions (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.months(id) on delete cascade,
  total_amount numeric(14,2) not null check (total_amount > 0),
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists investment_contributions_month_id_idx on public.investment_contributions(month_id);

create table if not exists public.investment_moves (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.investment_contributions(id) on delete cascade,
  account_id uuid not null references public.investment_accounts(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists investment_moves_contribution_id_idx on public.investment_moves(contribution_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.get_bills_due_before_payday(p_month_id uuid, p_payday_date date)
returns setof public.bills
language sql
stable
as $$
  select *
  from public.bills
  where month_id = p_month_id
    and paid = false
    and due_date <= p_payday_date
  order by due_date asc;
$$;

create or replace function public.get_dashboard_snapshot(p_month_id uuid)
returns jsonb
language plpgsql
stable
as $$
declare
  month_row public.months;
  expenses_total numeric(14,2);
  investments_total numeric(14,2);
  salary_received_amount numeric(14,2);
  bills_due jsonb;
  current_alloc jsonb;
  target_alloc jsonb;
  ending_cash numeric(14,2);
begin
  select * into month_row from public.months where id = p_month_id;
  if not found then
    return jsonb_build_object('error', 'month_not_found');
  end if;

  select coalesce(sum(amount), 0) into expenses_total
  from public.transactions
  where month_id = p_month_id and type = 'expense';

  select coalesce(sum(total_amount), 0) into investments_total
  from public.investment_contributions
  where month_id = p_month_id;

  if month_row.salary_received then
    salary_received_amount := month_row.expected_salary;
  else
    salary_received_amount := 0;
  end if;

  ending_cash := month_row.starting_cash + salary_received_amount - expenses_total - investments_total;

  select coalesce(jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'amount', b.amount, 'due_date', b.due_date, 'paid', b.paid, 'recurring', b.recurring) order by b.due_date asc), '[]'::jsonb)
  into bills_due
  from public.bills b
  where b.month_id = p_month_id
    and b.paid = false
    and (month_row.payday_date is null or b.due_date <= month_row.payday_date);

  select coalesce(jsonb_agg(jsonb_build_object('account_id', ia.id, 'name', ia.name, 'balance', ia.current_balance, 'percent', case when t.total > 0 then round((ia.current_balance / t.total) * 100, 2) else 0 end) order by ia.name asc), '[]'::jsonb)
  into current_alloc
  from public.investment_accounts ia
  cross join (select coalesce(sum(current_balance), 0) as total from public.investment_accounts) t;

  select coalesce(jsonb_agg(jsonb_build_object('id', it.id, 'name', it.name, 'target_percent', it.target_percent, 'account_id', it.account_id) order by it.name asc), '[]'::jsonb)
  into target_alloc
  from public.investment_targets it;

  return jsonb_build_object(
    'month', to_jsonb(month_row),
    'totals', jsonb_build_object('expenses', expenses_total, 'investments', investments_total, 'salary_received', salary_received_amount, 'ending_cash', ending_cash, 'budget_progress', case when month_row.budget_limit > 0 then round((expenses_total / month_row.budget_limit) * 100, 2) else 0 end),
    'bills_due_before_payday', bills_due,
    'investment_current_allocation', current_alloc,
    'investment_target_allocation', target_alloc
  );
end;
$$;

create or replace function public.apply_salary_received(p_month_id uuid, p_received boolean, p_received_date date default null)
returns public.months
language plpgsql
as $$
declare
  month_row public.months;
begin
  update public.months
  set salary_received = p_received,
      salary_received_date = case when p_received then coalesce(p_received_date, current_date) else null end
  where id = p_month_id
  returning * into month_row;

  if not found then
    raise exception 'month_not_found';
  end if;

  if p_received then
    insert into public.transactions (month_id, date, amount, type, notes, source, source_ref)
    values (p_month_id, coalesce(p_received_date, current_date), month_row.expected_salary, 'income', 'Salary auto-generated', 'salary', p_month_id)
    on conflict (source, source_ref)
    where source = 'salary' and source_ref is not null
    do update set date = excluded.date, amount = excluded.amount, type = excluded.type, notes = excluded.notes, month_id = excluded.month_id, updated_at = now();
  else
    delete from public.transactions
    where source = 'salary' and source_ref = p_month_id;
  end if;

  return month_row;
end;
$$;

create or replace function public.rollover_recurring_bills(p_from_month_id uuid, p_to_month_id uuid)
returns int
language plpgsql
as $$
declare
  inserted_count int;
begin
  with copied as (
    insert into public.bills (name, amount, due_date, month_id, paid, paid_date, recurring)
    select b.name, b.amount, (b.due_date + interval '1 month')::date, p_to_month_id, false, null, true
    from public.bills b
    where b.month_id = p_from_month_id
      and b.recurring = true
      and b.paid = false
    returning id
  )
  select count(*) into inserted_count from copied;

  return coalesce(inserted_count, 0);
end;
$$;
