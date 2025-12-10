  -- Create v_account_balances view
  -- Referenced in get_dashboard_metrics RPC

  create or replace view public.v_account_balances as
  select
    a.id as account_id,
    a.space_id,
    a.name,
    a.type,
    a.currency_code,
    a.is_archived,
    (
      coalesce(a.opening_balance, 0) +
      coalesce(sum(
        case
          when jl.direction = 'debit' then jl.amount_space
          when jl.direction = 'credit' then -jl.amount_space
          else 0
        end
      ), 0)
    ) as balance_space
  from public.accounts a
  left join public.journal_lines jl on a.id = jl.account_id
  group by a.id;
