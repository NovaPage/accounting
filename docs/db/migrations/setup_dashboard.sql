-- 1. Create transactions table if it doesn't exist
create table if not exists public.transactions (
  id uuid not null default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric not null default 0,
  type text not null check (type in ('income', 'expense', 'transfer')),
  date timestamptz not null default now(),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

-- 2. Enable RLS
alter table public.transactions enable row level security;

-- 3. RLS Policy: Users can see transactions in their active space
create policy "Users can view transactions in their spaces"
  on public.transactions for select
  using (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = transactions.space_id
      and sm.user_id = auth.uid()
    )
  );

create policy "Users can insert transactions in their spaces"
  on public.transactions for insert
  with check (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = transactions.space_id
      and sm.user_id = auth.uid()
    )
  );

create policy "Users can update transactions in their spaces"
  on public.transactions for update
  using (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = transactions.space_id
      and sm.user_id = auth.uid()
    )
  );

create policy "Users can delete transactions in their spaces"
  on public.transactions for delete
  using (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = transactions.space_id
      and sm.user_id = auth.uid()
    )
  );

-- 4. RPC for Dashboard Metrics
-- Calculates: Total Balance (from accounts), Monthly Income, Monthly Expense, Savings Rate
create or replace function public.get_dashboard_metrics(p_space_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_total_balance numeric;
  v_monthly_income numeric;
  v_monthly_expenses numeric;
  v_savings_rate numeric;
  v_currency_code text;
  v_start_of_month timestamptz;
begin
  -- Check if user has access to space
  if not exists (
    select 1 from public.space_members
    where space_id = p_space_id and user_id = auth.uid()
  ) then
    raise exception 'Access denied';
  end if;

  -- Get Space Currency (default to COP if null)
  select coalesce(currency_code, 'COP') into v_currency_code
  from public.spaces
  where id = p_space_id;

  -- 1. Total Balance: Sum of all active money accounts (cash, bank, card)
  select coalesce(sum(balance), 0)
  into v_total_balance
  from public.v_account_balances
  where space_id = p_space_id
  and type in ('cash', 'bank', 'card')
  and (is_archived is null or is_archived = false);

  -- 2. Monthly Stats
  v_start_of_month := date_trunc('month', now());

  select
    coalesce(sum(case when type = 'income' then amount else 0 end), 0),
    coalesce(sum(case when type = 'expense' then amount else 0 end), 0)
  into v_monthly_income, v_monthly_expenses
  from public.transactions
  where space_id = p_space_id
  and date >= v_start_of_month;

  -- 3. Savings Rate
  if v_monthly_income > 0 then
    v_savings_rate := round(((v_monthly_income - v_monthly_expenses) / v_monthly_income) * 100, 1);
  else
    v_savings_rate := 0;
  end if;

  return json_build_object(
    'totalBalance', v_total_balance,
    'monthlyIncome', v_monthly_income,
    'monthlyExpenses', v_monthly_expenses,
    'savingsRate', v_savings_rate,
    'currencyCode', v_currency_code
  );
end;
$$;
