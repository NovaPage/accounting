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
  -- FIX: Join with accounts table to filter by type and is_archived
  select coalesce(sum(v.balance_space), 0)
  into v_total_balance
  from public.v_account_balances v
  join public.accounts a on a.id = v.account_id
  where v.space_id = p_space_id
  and a.type in ('cash', 'bank', 'card')
  and (a.is_archived is null or a.is_archived = false);

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
