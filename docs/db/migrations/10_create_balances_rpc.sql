-- File: docs/db/migrations/10_create_balances_rpc.sql

-- This RPC was missing from previous migrations but is used by AccountService.
-- It works similarly to v_account_balances but optimized for specific account IDs.

CREATE OR REPLACE FUNCTION public.get_balances_for_accounts(
    p_space_id uuid,
    p_account_ids uuid[]
)
RETURNS TABLE (
    account_id uuid,
    balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id AS account_id,
        (
            COALESCE(a.opening_balance, 0) +
            COALESCE((
                SELECT SUM(
                    CASE
                        WHEN jl.direction = 'debit' THEN jl.amount_space
                        WHEN jl.direction = 'credit' THEN -jl.amount_space
                        ELSE 0
                    END
                )
                FROM public.journal_lines jl
                WHERE jl.account_id = a.id
            ), 0)
        ) AS balance
    FROM public.accounts a
    WHERE a.space_id = p_space_id
      AND a.id = ANY(p_account_ids);
END;
$$;
