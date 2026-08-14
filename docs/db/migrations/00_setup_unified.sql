-- =============================================================================
-- Orbit Accounting - Unified Database Setup
-- =============================================================================
-- Consolidates all incremental migrations (01-20) into one idempotent script.
-- Original migration files (01-20) are preserved for reference.
-- Usage: Run this file in the Supabase SQL Editor on a fresh project.

-- 1. ENUMS
CREATE TYPE public.account_type AS ENUM ('cash', 'bank', 'card', 'other');
CREATE TYPE public.member_role AS ENUM ('owner', 'member');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE public.line_direction AS ENUM ('debit', 'credit');

-- 2. CORE TABLES

-- 2.1 Spaces (multi-tenant containers)
CREATE TABLE IF NOT EXISTS public.spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    currency_code TEXT,
    owner_user_id UUID NOT NULL,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Space Members (membership / sharing)
CREATE TABLE IF NOT EXISTS public.space_members (
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role public.member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (space_id, user_id)
);

-- 2.3 Accounts (financial accounts: cash, bank, card)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type public.account_type NOT NULL DEFAULT 'cash',
    currency_code TEXT,
    opening_balance NUMERIC(20,6) DEFAULT 0,
    allow_negative BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    order_index INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (space_id, name)
);

-- 2.4 Categories (hierarchical)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (space_id, parent_id, name)
);

-- 2.5 Journals (double-entry ledger - auto-created from transactions)
CREATE TABLE IF NOT EXISTS public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    journal_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    memo TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 Journal Lines (individual ledger entries)
CREATE TABLE IF NOT EXISTS public.journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    direction public.line_direction NOT NULL,
    amount_original NUMERIC(20,6) NOT NULL DEFAULT 0,
    currency_original TEXT,
    fx_rate_to_space NUMERIC(20,6) NOT NULL DEFAULT 1,
    amount_space NUMERIC(20,6) NOT NULL DEFAULT 0,
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Transactions (user-facing operations - simpler model)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC(20,6) NOT NULL DEFAULT 0,
    type public.transaction_type NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    description TEXT,
    payee TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 Budgets (monthly planning)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    currency_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 Budget Items (per-category allocations)
CREATE TABLE IF NOT EXISTS public.budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount_planned NUMERIC(20,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_accounts_space_id ON public.accounts(space_id);
CREATE INDEX IF NOT EXISTS idx_categories_space_id ON public.categories(space_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_space_date ON public.transactions(space_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_journals_space_id ON public.journals(space_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_journal_id ON public.journal_lines(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account_id ON public.journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_category_id ON public.journal_lines(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_space_id ON public.budgets(space_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);

-- 4. TRIGGER FUNCTIONS

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION public.sync_transaction_to_journal()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
DECLARE
    v_journal_id UUID;
    v_currency_code TEXT;
    v_direction public.line_direction;
BEGIN
    SELECT COALESCE(currency_code, 'COP') INTO v_currency_code
    FROM public.spaces WHERE id = NEW.space_id;

    INSERT INTO public.journals (space_id, journal_date, memo, created_by, created_at, updated_at)
    VALUES (NEW.space_id, NEW.date, NEW.description, auth.uid(), now(), now())
    RETURNING id INTO v_journal_id;

    IF NEW.type = 'income' THEN
        v_direction := 'debit';
    ELSE
        v_direction := 'credit';
    END IF;

    INSERT INTO public.journal_lines (journal_id, account_id, category_id, memo,
        amount_original, amount_space, currency_original, fx_rate_to_space,
        direction, created_at, updated_at)
    VALUES (v_journal_id, NEW.account_id, NEW.category_id, NEW.description,
        NEW.amount, NEW.amount, v_currency_code, 1.0, v_direction, now(), now());

    RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION public.check_journal_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
BEGIN
    RETURN NEW;
END;
$func$;

-- 5. TRIGGERS

-- 5.1 updated_at triggers on core tables
DROP TRIGGER IF EXISTS trg_set_updated_at ON public.spaces;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.spaces FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON public.accounts;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON public.categories;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON public.transactions;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON public.journals;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.journals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON public.journal_lines;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.journal_lines FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON public.budgets;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON public.budget_items;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.budget_items FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5.2 Transaction -> Journal sync trigger
DROP TRIGGER IF EXISTS trg_sync_transaction_to_journal ON public.transactions;
CREATE TRIGGER trg_sync_transaction_to_journal
    AFTER INSERT ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_transaction_to_journal();

-- 6. RLS HELPER FUNCTIONS (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_space_member(_space_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = public
AS $func$
    SELECT EXISTS (SELECT 1 FROM public.space_members WHERE space_id = _space_id AND user_id = auth.uid());
$func$;

CREATE OR REPLACE FUNCTION public.is_space_owner(_space_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = public
AS $func$
    SELECT EXISTS (SELECT 1 FROM public.spaces WHERE id = _space_id AND owner_user_id = auth.uid());
$func$;

-- 7. ROW LEVEL SECURITY
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- 7.1 Spaces policies
CREATE POLICY "spaces_read" ON public.spaces FOR SELECT TO authenticated USING (
    owner_user_id = (SELECT auth.uid()) OR public.is_space_member(id)
);
CREATE POLICY "spaces_insert" ON public.spaces FOR INSERT TO authenticated WITH CHECK (
    owner_user_id = (SELECT auth.uid())
);
CREATE POLICY "spaces_update" ON public.spaces FOR UPDATE TO authenticated USING (
    owner_user_id = (SELECT auth.uid())
);
CREATE POLICY "spaces_delete" ON public.spaces FOR DELETE TO authenticated USING (
    owner_user_id = (SELECT auth.uid())
);

-- 7.2 Space Members policies
CREATE POLICY "members_read" ON public.space_members FOR SELECT TO authenticated USING (
    user_id = (SELECT auth.uid()) OR public.is_space_owner(space_id)
);
CREATE POLICY "members_insert" ON public.space_members FOR INSERT TO authenticated WITH CHECK (
    public.is_space_owner(space_id)
);
CREATE POLICY "members_update" ON public.space_members FOR UPDATE TO authenticated USING (
    public.is_space_owner(space_id)
);
CREATE POLICY "members_delete" ON public.space_members FOR DELETE TO authenticated USING (
    public.is_space_owner(space_id)
);

-- 7.3 Accounts/Categories/Transactions/Journals/Budgets policies
CREATE POLICY "accounts_crud" ON public.accounts FOR ALL TO authenticated USING (public.is_space_member(space_id));
CREATE POLICY "categories_crud" ON public.categories FOR ALL TO authenticated USING (public.is_space_member(space_id));
CREATE POLICY "transactions_crud" ON public.transactions FOR ALL TO authenticated USING (public.is_space_member(space_id));
CREATE POLICY "journals_crud" ON public.journals FOR ALL TO authenticated USING (public.is_space_member(space_id));
CREATE POLICY "budgets_crud" ON public.budgets FOR ALL TO authenticated USING (public.is_space_member(space_id));

-- 7.4 Journal Lines policy (via parent journal)
CREATE POLICY "jlines_crud" ON public.journal_lines FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.journals WHERE journals.id = public.journal_lines.journal_id AND public.is_space_member(journals.space_id))
);

-- 7.5 Budget Items policy (via parent budget)
CREATE POLICY "bitems_crud" ON public.budget_items FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.budgets WHERE budgets.id = public.budget_items.budget_id AND public.is_space_member(budgets.space_id))
);

-- 8. VIEWS
CREATE OR REPLACE VIEW public.v_account_balances AS
SELECT
    a.id AS account_id,
    a.space_id,
    a.name AS name,
    a.type,
    a.currency_code,
    a.is_archived,
    (COALESCE(a.opening_balance, 0) +
     COALESCE(SUM(CASE
         WHEN jl.direction = 'debit' THEN jl.amount_space
         WHEN jl.direction = 'credit' THEN -jl.amount_space
         ELSE 0
     END), 0)) AS balance_space
FROM public.accounts a
LEFT JOIN public.journal_lines jl ON a.id = jl.account_id
GROUP BY a.id;

ALTER VIEW public.v_account_balances SET (security_invoker = true);

-- 9. RPC: onboard_first_login
-- Creates a default space, space_member, default account, and categories.
CREATE OR REPLACE FUNCTION public.onboard_first_login(p_user_id UUID, p_currency_code TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
DECLARE
    v_space_id UUID;
    v_currency TEXT;
BEGIN
    v_currency := COALESCE(p_currency_code, 'COP');

    INSERT INTO public.spaces (id, name, currency_code, owner_user_id, is_archived, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Personal', v_currency, p_user_id, false, now(), now())
    RETURNING id INTO v_space_id;

    INSERT INTO public.space_members (space_id, user_id, role, joined_at)
    VALUES (v_space_id, p_user_id, 'owner', now());

    INSERT INTO public.accounts (space_id, name, type, currency_code, opening_balance, allow_negative, is_archived, order_index, created_at, updated_at)
    VALUES (v_space_id, 'Efectivo', 'cash', v_currency, 0, true, false, 0, now(), now());

    INSERT INTO public.categories (space_id, name, parent_id, is_archived, created_at, updated_at)
    VALUES
        (v_space_id, 'Alimentacion', NULL, false, now(), now()),
        (v_space_id, 'Transporte', NULL, false, now(), now()),
        (v_space_id, 'Ocio', NULL, false, now(), now()),
        (v_space_id, 'Hogar', NULL, false, now(), now()),
        (v_space_id, 'Otros', NULL, false, now(), now());

    RETURN v_space_id::TEXT;
END;
$func$;

-- 10. RPC: get_user_spaces
CREATE OR REPLACE FUNCTION public.get_user_spaces(p_user_id UUID)
RETURNS TABLE (id UUID, name TEXT, currency_code TEXT, role public.member_role)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.currency_code, sm.role
    FROM public.spaces s
    JOIN public.space_members sm ON sm.space_id = s.id
    WHERE sm.user_id = p_user_id
    ORDER BY s.created_at DESC;
END;
$func$;

-- 11. RPC: get_balances_for_accounts
CREATE OR REPLACE FUNCTION public.get_balances_for_accounts(p_space_id UUID, p_account_ids UUID[])
RETURNS TABLE (account_id UUID, balance NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
BEGIN
    RETURN QUERY
    SELECT
        a.id AS account_id,
        (COALESCE(a.opening_balance, 0) +
         COALESCE(SUM(CASE
             WHEN jl.direction = 'debit' THEN jl.amount_space
             WHEN jl.direction = 'credit' THEN -jl.amount_space
             ELSE 0
         END), 0)) AS balance
    FROM public.accounts a
    LEFT JOIN public.journal_lines jl ON jl.account_id = a.id
    WHERE a.space_id = p_space_id AND a.id = ANY(p_account_ids)
    GROUP BY a.id, a.opening_balance;
END;
$func$;

-- 12. RPC: get_dashboard_metrics
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(p_space_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
DECLARE
    v_total_balance NUMERIC;
    v_monthly_income NUMERIC;
    v_monthly_expenses NUMERIC;
    v_prev_monthly_income NUMERIC;
    v_prev_monthly_expenses NUMERIC;
    v_income_change_pct NUMERIC;
    v_expenses_change_pct NUMERIC;
    v_savings_rate NUMERIC;
    v_currency_code TEXT;
    v_start_of_month TIMESTAMPTZ;
    v_start_of_prev_month TIMESTAMPTZ;
    v_end_of_prev_month TIMESTAMPTZ;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.space_members WHERE space_id = p_space_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT COALESCE(currency_code, 'COP') INTO v_currency_code FROM public.spaces WHERE id = p_space_id;

    SELECT COALESCE(SUM(v.balance_space), 0) INTO v_total_balance
    FROM public.v_account_balances v
    JOIN public.accounts a ON a.id = v.account_id
    WHERE v.space_id = p_space_id AND a.type IN ('cash', 'bank', 'card')
      AND (a.is_archived IS NULL OR a.is_archived = false);

    v_start_of_month := DATE_TRUNC('month', NOW());

    SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
    INTO v_monthly_income, v_monthly_expenses
    FROM public.transactions
    WHERE space_id = p_space_id AND date >= v_start_of_month;

    v_start_of_prev_month := DATE_TRUNC('month', NOW() - INTERVAL '1 month');
    v_end_of_prev_month := v_start_of_month - INTERVAL '1 second';

    SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
    INTO v_prev_monthly_income, v_prev_monthly_expenses
    FROM public.transactions
    WHERE space_id = p_space_id AND date >= v_start_of_prev_month AND date <= v_end_of_prev_month;

    IF v_prev_monthly_income = 0 THEN
        v_income_change_pct := CASE WHEN v_monthly_income > 0 THEN 100 ELSE 0 END;
    ELSE
        v_income_change_pct := ROUND(((v_monthly_income - v_prev_monthly_income) / v_prev_monthly_income) * 100, 1);
    END IF;

    IF v_prev_monthly_expenses = 0 THEN
        v_expenses_change_pct := CASE WHEN v_monthly_expenses > 0 THEN 100 ELSE 0 END;
    ELSE
        v_expenses_change_pct := ROUND(((v_monthly_expenses - v_prev_monthly_expenses) / v_prev_monthly_expenses) * 100, 1);
    END IF;

    IF v_monthly_income > 0 THEN
        v_savings_rate := ROUND(((v_monthly_income - v_monthly_expenses) / v_monthly_income) * 100, 1);
    ELSE
        v_savings_rate := 0;
    END IF;

    RETURN JSON_BUILD_OBJECT(
        'totalBalance', v_total_balance,
        'monthlyIncome', v_monthly_income,
        'monthlyExpenses', v_monthly_expenses,
        'incomeChangePct', v_income_change_pct,
        'expensesChangePct', v_expenses_change_pct,
        'savingsRate', v_savings_rate,
        'currencyCode', v_currency_code
    );
END;
$func$;

-- 13. RPC: invite_user_by_email
CREATE OR REPLACE FUNCTION public.invite_user_by_email(p_space_id UUID, p_email TEXT, p_role public.member_role DEFAULT 'member')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
DECLARE
    v_target_user_id UUID;
    v_caller_role public.member_role;
BEGIN
    SELECT role INTO v_caller_role FROM public.space_members
    WHERE space_id = p_space_id AND user_id = auth.uid();

    IF v_caller_role IS NULL OR v_caller_role <> 'owner' THEN
        RAISE EXCEPTION 'Access denied: Only owners can invite members.';
    END IF;

    SELECT id INTO v_target_user_id FROM auth.users WHERE email = p_email;

    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: The email % is not registered.', p_email;
    END IF;

    IF EXISTS (SELECT 1 FROM public.space_members WHERE space_id = p_space_id AND user_id = v_target_user_id) THEN
        RAISE NOTICE 'User is already a member.';
        RETURN;
    END IF;

    INSERT INTO public.space_members (space_id, user_id, role) VALUES (p_space_id, v_target_user_id, p_role);
END;
$func$;

-- =============================================================================
-- Setup complete.
-- =============================================================================
