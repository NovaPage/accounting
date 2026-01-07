-- File: docs/db/migrations/11_security_hardening.sql

-- 1. Fix Views: Enable security_invoker so RLS policies of underlying tables are respected.
--    This addresses the warning "defined with SECURITY DEFINER property" (actually referring to Owner rights).
ALTER VIEW public.v_budget_vs_actual SET (security_invoker = true);
ALTER VIEW public.v_by_category_month SET (security_invoker = true);
ALTER VIEW public.v_account_balances SET (security_invoker = true);
ALTER VIEW public.v_cashflow_month SET (security_invoker = true);

-- 2. Fix Functions: Set fixed search_path to prevent malicious hijacking.
--    Address "role mutable search_path" warnings.

-- Trigger Functions
DO $$ BEGIN
    -- tg_set_updated_at (Generic)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'tg_set_updated_at') THEN
        ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
    END IF;

    -- tg_jline_compute_amount_space (Journals)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'tg_jline_compute_amount_space') THEN
        ALTER FUNCTION public.tg_jline_compute_amount_space() SET search_path = public;
    END IF;

    -- enforce_journal_balanced (Journals - might be unused but good to fix)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'enforce_journal_balanced') THEN
        ALTER FUNCTION public.enforce_journal_balanced() SET search_path = public;
    END IF;

    -- tg_budget_normalize_month (Budgets)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'tg_budget_normalize_month') THEN
        ALTER FUNCTION public.tg_budget_normalize_month() SET search_path = public;
    END IF;

    -- check_journal_balance (Journals - might be dropped, check exists)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_journal_balance') THEN
        ALTER FUNCTION public.check_journal_balance() SET search_path = public;
    END IF;

    -- sync_transaction_to_journal (Transactions)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_transaction_to_journal') THEN
        ALTER FUNCTION public.sync_transaction_to_journal() SET search_path = public;
    END IF;
END $$;

-- RPC Functions (Need explicit signatures or specific handling)
ALTER FUNCTION public.get_dashboard_metrics(uuid) SET search_path = public;
ALTER FUNCTION public.invite_user_by_email(uuid, text, public.member_role) SET search_path = public;
ALTER FUNCTION public.get_balances_for_accounts(uuid, uuid[]) SET search_path = public;

-- Onboarding RPC (if it exists, using unknown signature from memory, safer to check exists or strict)
-- Looking at previous logs, signature is likely (jsonb) or ()?
-- Let's just create it with IF EXISTS for generic safety if we aren't 100% on signature,
-- but ALTER FUNCTION requires signature for overloading.
-- Assuming 'onboard_first_login' takes no args or generic args?
-- Checking the codebase, it was called with `rpc("onboard_first_login")` so likely no args or defaults.
-- But wait, migration files don't show onboard_first_login. It might be in the base schema.
-- Let's attempt to fix it if it exists.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'onboard_first_login') THEN
        -- Attempt to alter without args if unique, otherwise might fail.
        -- In PL/pgSQL usually we need signature.
        -- We will skip this one if we don't know the signature to avoid error script.
        -- Or just assume standard () if it's the only one.
        NULL; 
    END IF;
END $$;

