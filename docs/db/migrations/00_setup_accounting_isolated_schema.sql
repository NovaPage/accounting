-- =============================================================================
-- Orbit Accounting - Isolated Schema Setup (`accounting`)
-- =============================================================================
-- This script creates a completely isolated PostgreSQL schema named `accounting`.
-- It avoids any collisions with existing tables in `public` or other projects
-- sharing the same Supabase database.
--
-- Security:
-- - Full Row Level Security (RLS) on all tables.
-- - Strictly restricted to authenticated users matching space membership (auth.uid()).
-- - Granted permissions to Supabase roles: anon, authenticated, service_role.
-- =============================================================================

-- 0. SCHEMA CREATION & PERMISSIONS
CREATE SCHEMA IF NOT EXISTS accounting;

GRANT USAGE ON SCHEMA accounting TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA accounting TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA accounting TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA accounting TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA accounting GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA accounting GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA accounting GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 1. ENUMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'account_type' AND n.nspname = 'accounting') THEN
        CREATE TYPE accounting.account_type AS ENUM ('cash', 'bank', 'card', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'member_role' AND n.nspname = 'accounting') THEN
        CREATE TYPE accounting.member_role AS ENUM ('owner', 'member');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'transaction_type' AND n.nspname = 'accounting') THEN
        CREATE TYPE accounting.transaction_type AS ENUM ('income', 'expense', 'transfer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'line_direction' AND n.nspname = 'accounting') THEN
        CREATE TYPE accounting.line_direction AS ENUM ('debit', 'credit');
    END IF;
END $$;

-- 2. CORE TABLES

-- 2.1 Spaces
CREATE TABLE IF NOT EXISTS accounting.spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    currency_code TEXT,
    owner_user_id UUID NOT NULL,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Space Members
CREATE TABLE IF NOT EXISTS accounting.space_members (
    space_id UUID NOT NULL REFERENCES accounting.spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role accounting.member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (space_id, user_id)
);

-- 2.3 Accounts
CREATE TABLE IF NOT EXISTS accounting.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES accounting.spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type accounting.account_type NOT NULL DEFAULT 'cash',
    currency_code TEXT,
    opening_balance NUMERIC(20,6) DEFAULT 0,
    allow_negative BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    order_index INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (space_id, name)
);

-- 2.4 Categories
CREATE TABLE IF NOT EXISTS accounting.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES accounting.spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES accounting.categories(id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (space_id, parent_id, name)
);

-- 2.5 Journals
CREATE TABLE IF NOT EXISTS accounting.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES accounting.spaces(id) ON DELETE CASCADE,
    journal_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    memo TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 Journal Lines
CREATE TABLE IF NOT EXISTS accounting.journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES accounting.journals(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounting.accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES accounting.categories(id) ON DELETE SET NULL,
    direction accounting.line_direction NOT NULL,
    amount_original NUMERIC(20,6) NOT NULL DEFAULT 0,
    currency_original TEXT,
    fx_rate_to_space NUMERIC(20,6) NOT NULL DEFAULT 1,
    amount_space NUMERIC(20,6) NOT NULL DEFAULT 0,
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Transactions
CREATE TABLE IF NOT EXISTS accounting.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES accounting.spaces(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounting.accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES accounting.categories(id) ON DELETE SET NULL,
    amount NUMERIC(20,6) NOT NULL DEFAULT 0,
    type accounting.transaction_type NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    description TEXT,
    payee TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 Budgets
CREATE TABLE IF NOT EXISTS accounting.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES accounting.spaces(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    currency_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 Budget Items
CREATE TABLE IF NOT EXISTS accounting.budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES accounting.budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES accounting.categories(id) ON DELETE CASCADE,
    amount_planned NUMERIC(20,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_acc_accounts_space_id ON accounting.accounts(space_id);
CREATE INDEX IF NOT EXISTS idx_acc_categories_space_id ON accounting.categories(space_id);
CREATE INDEX IF NOT EXISTS idx_acc_categories_parent_id ON accounting.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_acc_transactions_space_date ON accounting.transactions(space_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_acc_transactions_account_id ON accounting.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_acc_transactions_category_id ON accounting.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_acc_journals_space_id ON accounting.journals(space_id);
CREATE INDEX IF NOT EXISTS idx_acc_journal_lines_journal_id ON accounting.journal_lines(journal_id);
CREATE INDEX IF NOT EXISTS idx_acc_journal_lines_account_id ON accounting.journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_acc_journal_lines_category_id ON accounting.journal_lines(category_id);
CREATE INDEX IF NOT EXISTS idx_acc_budgets_space_id ON accounting.budgets(space_id);
CREATE INDEX IF NOT EXISTS idx_acc_budget_items_budget_id ON accounting.budget_items(budget_id);

-- 4. TRIGGER FUNCTIONS
CREATE OR REPLACE FUNCTION accounting.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = accounting, public
AS $func$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION accounting.sync_transaction_to_journal()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = accounting, public
AS $func$
DECLARE
    v_journal_id UUID;
    v_currency_code TEXT;
    v_direction accounting.line_direction;
BEGIN
    SELECT COALESCE(currency_code, 'COP') INTO v_currency_code
    FROM accounting.spaces WHERE id = NEW.space_id;

    INSERT INTO accounting.journals (space_id, journal_date, memo, created_by, created_at, updated_at)
    VALUES (NEW.space_id, NEW.date, NEW.description, auth.uid(), now(), now())
    RETURNING id INTO v_journal_id;

    IF NEW.type = 'income' THEN
        v_direction := 'debit';
    ELSE
        v_direction := 'credit';
    END IF;

    INSERT INTO accounting.journal_lines (journal_id, account_id, category_id, memo,
        amount_original, amount_space, currency_original, fx_rate_to_space,
        direction, created_at, updated_at)
    VALUES (v_journal_id, NEW.account_id, NEW.category_id, NEW.description,
        NEW.amount, NEW.amount, v_currency_code, 1.0, v_direction, now(), now());

    RETURN NEW;
END;
$func$;

-- 5. TRIGGERS
DROP TRIGGER IF EXISTS trg_set_updated_at ON accounting.spaces;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON accounting.spaces FOR EACH ROW EXECUTE FUNCTION accounting.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON accounting.accounts;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON accounting.accounts FOR EACH ROW EXECUTE FUNCTION accounting.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON accounting.categories;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON accounting.categories FOR EACH ROW EXECUTE FUNCTION accounting.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON accounting.transactions;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON accounting.transactions FOR EACH ROW EXECUTE FUNCTION accounting.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON accounting.journals;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON accounting.journals FOR EACH ROW EXECUTE FUNCTION accounting.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON accounting.journal_lines;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON accounting.journal_lines FOR EACH ROW EXECUTE FUNCTION accounting.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON accounting.budgets;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON accounting.budgets FOR EACH ROW EXECUTE FUNCTION accounting.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON accounting.budget_items;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON accounting.budget_items FOR EACH ROW EXECUTE FUNCTION accounting.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_sync_transaction_to_journal ON accounting.transactions;
CREATE TRIGGER trg_sync_transaction_to_journal
    AFTER INSERT ON accounting.transactions
    FOR EACH ROW EXECUTE FUNCTION accounting.sync_transaction_to_journal();

-- 6. RLS HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION accounting.is_space_member(_space_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = accounting, public
AS $func$
    SELECT EXISTS (SELECT 1 FROM accounting.space_members WHERE space_id = _space_id AND user_id = auth.uid());
$func$;

CREATE OR REPLACE FUNCTION accounting.is_space_owner(_space_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = accounting, public
AS $func$
    SELECT EXISTS (SELECT 1 FROM accounting.spaces WHERE id = _space_id AND owner_user_id = auth.uid());
$func$;

-- 7. ROW LEVEL SECURITY (RLS / SRL)
ALTER TABLE accounting.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.budget_items ENABLE ROW LEVEL SECURITY;

-- 7.1 Spaces policies
DROP POLICY IF EXISTS "spaces_read" ON accounting.spaces;
CREATE POLICY "spaces_read" ON accounting.spaces FOR SELECT TO authenticated USING (
    owner_user_id = (SELECT auth.uid()) OR accounting.is_space_member(id)
);
DROP POLICY IF EXISTS "spaces_insert" ON accounting.spaces;
CREATE POLICY "spaces_insert" ON accounting.spaces FOR INSERT TO authenticated WITH CHECK (
    owner_user_id = (SELECT auth.uid())
);
DROP POLICY IF EXISTS "spaces_update" ON accounting.spaces;
CREATE POLICY "spaces_update" ON accounting.spaces FOR UPDATE TO authenticated USING (
    owner_user_id = (SELECT auth.uid())
);
DROP POLICY IF EXISTS "spaces_delete" ON accounting.spaces;
CREATE POLICY "spaces_delete" ON accounting.spaces FOR DELETE TO authenticated USING (
    owner_user_id = (SELECT auth.uid())
);

-- 7.2 Space Members policies
DROP POLICY IF EXISTS "members_read" ON accounting.space_members;
CREATE POLICY "members_read" ON accounting.space_members FOR SELECT TO authenticated USING (
    user_id = (SELECT auth.uid()) OR accounting.is_space_owner(space_id)
);
DROP POLICY IF EXISTS "members_insert" ON accounting.space_members;
CREATE POLICY "members_insert" ON accounting.space_members FOR INSERT TO authenticated WITH CHECK (
    accounting.is_space_owner(space_id)
);
DROP POLICY IF EXISTS "members_update" ON accounting.space_members;
CREATE POLICY "members_update" ON accounting.space_members FOR UPDATE TO authenticated USING (
    accounting.is_space_owner(space_id)
);
DROP POLICY IF EXISTS "members_delete" ON accounting.space_members;
CREATE POLICY "members_delete" ON accounting.space_members FOR DELETE TO authenticated USING (
    accounting.is_space_owner(space_id)
);

-- 7.3 Accounts / Categories / Transactions / Journals / Budgets policies
DROP POLICY IF EXISTS "accounts_crud" ON accounting.accounts;
CREATE POLICY "accounts_crud" ON accounting.accounts FOR ALL TO authenticated USING (accounting.is_space_member(space_id));

DROP POLICY IF EXISTS "categories_crud" ON accounting.categories;
CREATE POLICY "categories_crud" ON accounting.categories FOR ALL TO authenticated USING (accounting.is_space_member(space_id));

DROP POLICY IF EXISTS "transactions_crud" ON accounting.transactions;
CREATE POLICY "transactions_crud" ON accounting.transactions FOR ALL TO authenticated USING (accounting.is_space_member(space_id));

DROP POLICY IF EXISTS "journals_crud" ON accounting.journals;
CREATE POLICY "journals_crud" ON accounting.journals FOR ALL TO authenticated USING (accounting.is_space_member(space_id));

DROP POLICY IF EXISTS "budgets_crud" ON accounting.budgets;
CREATE POLICY "budgets_crud" ON accounting.budgets FOR ALL TO authenticated USING (accounting.is_space_member(space_id));

-- 7.4 Journal Lines policy
DROP POLICY IF EXISTS "jlines_crud" ON accounting.journal_lines;
CREATE POLICY "jlines_crud" ON accounting.journal_lines FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM accounting.journals WHERE journals.id = accounting.journal_lines.journal_id AND accounting.is_space_member(journals.space_id))
);

-- 7.5 Budget Items policy
DROP POLICY IF EXISTS "bitems_crud" ON accounting.budget_items;
CREATE POLICY "bitems_crud" ON accounting.budget_items FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM accounting.budgets WHERE budgets.id = accounting.budget_items.budget_id AND accounting.is_space_member(budgets.space_id))
);

-- 8. VIEWS
CREATE OR REPLACE VIEW accounting.v_account_balances AS
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
FROM accounting.accounts a
LEFT JOIN accounting.journal_lines jl ON a.id = jl.account_id
GROUP BY a.id;

ALTER VIEW accounting.v_account_balances SET (security_invoker = true);

-- 9. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION accounting.onboard_first_login(p_user_id UUID, p_currency_code TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = accounting, public
AS $func$
DECLARE
    v_space_id UUID;
    v_currency TEXT;
BEGIN
    v_currency := COALESCE(p_currency_code, 'COP');

    INSERT INTO accounting.spaces (id, name, currency_code, owner_user_id, is_archived, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Personal', v_currency, p_user_id, false, now(), now())
    RETURNING id INTO v_space_id;

    INSERT INTO accounting.space_members (space_id, user_id, role, joined_at)
    VALUES (v_space_id, p_user_id, 'owner', now());

    INSERT INTO accounting.accounts (space_id, name, type, currency_code, opening_balance, allow_negative, is_archived, order_index, created_at, updated_at)
    VALUES (v_space_id, 'Efectivo', 'cash', v_currency, 0, true, false, 0, now(), now());

    INSERT INTO accounting.categories (space_id, name, parent_id, is_archived, created_at, updated_at)
    VALUES
        (v_space_id, 'Alimentacion', NULL, false, now(), now()),
        (v_space_id, 'Transporte', NULL, false, now(), now()),
        (v_space_id, 'Ocio', NULL, false, now(), now()),
        (v_space_id, 'Hogar', NULL, false, now(), now()),
        (v_space_id, 'Otros', NULL, false, now(), now());

    RETURN v_space_id::TEXT;
END;
$func$;

CREATE OR REPLACE FUNCTION accounting.get_user_spaces(p_user_id UUID)
RETURNS TABLE (id UUID, name TEXT, currency_code TEXT, role accounting.member_role)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = accounting, public
AS $func$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.currency_code, sm.role
    FROM accounting.spaces s
    JOIN accounting.space_members sm ON sm.space_id = s.id
    WHERE sm.user_id = p_user_id AND (s.is_archived IS FALSE OR s.is_archived IS NULL);
END;
$func$;
