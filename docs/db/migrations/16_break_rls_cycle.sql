-- File: docs/db/migrations/16_break_rls_cycle.sql

-- PROBLEM:
-- Infinite RLS recursion between spaces <-> members.
-- Solution requires dropping the looping function.
-- Dropping the function requires CASCADE, which drops dependent policies on other tables.
-- THIS SCRIPT REBUILDS EVERYTHING.

-- 1. DROP FUNCTIONS (CASCADE to remove old policies)
DROP FUNCTION IF EXISTS public.is_space_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_space_owner(uuid) CASCADE;

-- 2. RECREATE FUNCTIONS (Security Definer to break cycles)
CREATE OR REPLACE FUNCTION public.is_space_member(_space_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.space_members
    WHERE space_id = _space_id
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_space_owner(_space_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.spaces
    WHERE id = _space_id
    AND owner_user_id = auth.uid()
  );
$$;

-- 3. RESTORE POLICIES

-- SPACES
DROP POLICY IF EXISTS "spaces_read" ON public.spaces;
CREATE POLICY "spaces_read" ON public.spaces
FOR SELECT TO authenticated USING (
    owner_user_id = (select auth.uid()) OR public.is_space_member(id)
);

-- SPACE MEMBERS
DROP POLICY IF EXISTS "members_read" ON public.space_members;
CREATE POLICY "members_read" ON public.space_members
FOR SELECT TO authenticated USING (
    user_id = (select auth.uid()) OR public.is_space_owner(space_id)
);

DROP POLICY IF EXISTS "members_write" ON public.space_members;
CREATE POLICY "members_write" ON public.space_members
FOR INSERT TO authenticated WITH CHECK ( public.is_space_owner(space_id) );

DROP POLICY IF EXISTS "members_modify" ON public.space_members;
CREATE POLICY "members_modify" ON public.space_members
FOR UPDATE TO authenticated USING ( public.is_space_owner(space_id) );

DROP POLICY IF EXISTS "members_delete" ON public.space_members;
CREATE POLICY "members_delete" ON public.space_members
FOR DELETE TO authenticated USING ( public.is_space_owner(space_id) );

-- TRANSACTIONS
-- (Simple direct space_id check)
CREATE POLICY "transactions_crud_member" ON public.transactions
FOR ALL TO authenticated USING ( public.is_space_member(space_id) );

-- ACCOUNTS
-- (Simple direct space_id check)
CREATE POLICY "accounts_crud_member" ON public.accounts
FOR ALL TO authenticated USING ( public.is_space_member(space_id) );

-- CATEGORIES
-- (Simple direct space_id check)
CREATE POLICY "categories_crud_member" ON public.categories
FOR ALL TO authenticated USING ( public.is_space_member(space_id) );

-- JOURNALS
-- (Simple direct space_id check)
CREATE POLICY "journals_crud_member" ON public.journals
FOR ALL TO authenticated USING ( public.is_space_member(space_id) );

-- JOURNAL LINES
-- (Indirection via journal_id)
CREATE POLICY "jlines_crud_member" ON public.journal_lines
FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.journals
        WHERE journals.id = public.journal_lines.journal_id
        AND public.is_space_member(journals.space_id)
    )
);

-- BUDGETS
-- (Simple direct space_id check)
CREATE POLICY "budgets_crud_member" ON public.budgets
FOR ALL TO authenticated USING ( public.is_space_member(space_id) );

-- BUDGET ITEMS
-- (Indirection via budget_id)
CREATE POLICY "bitems_crud_member" ON public.budget_items
FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.budgets
        WHERE budgets.id = public.budget_items.budget_id
        AND public.is_space_member(budgets.space_id)
    )
);
