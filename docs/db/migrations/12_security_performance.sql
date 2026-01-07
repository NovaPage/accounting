-- File: docs/db/migrations/12_security_performance.sql

-- 1. FIX FUNCTION SECURITY (Search Path)
-- Fixes "Function public.onboard_first_login has a role mutable search_path"
-- Based on usage, it takes user_id and currency_code.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'onboard_first_login') THEN
        ALTER FUNCTION public.onboard_first_login(uuid, text) SET search_path = public;
    END IF;
END $$;

-- 2. FIX RLS PERFORMANCE (Suboptimal auth.uid() calls)
-- Supabase recommends wrapping auth functions in (select ...) to cache per transaction.

-- Spaces Table Policies
DROP POLICY IF EXISTS "Users can insert their own spaces" ON public.spaces;
CREATE POLICY "Users can insert their own spaces" ON public.spaces
FOR INSERT TO authenticated WITH CHECK (
    owner_user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can view spaces they own" ON public.spaces;
CREATE POLICY "Users can view spaces they own" ON public.spaces
FOR SELECT TO authenticated USING (
    owner_user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update spaces they own" ON public.spaces;
CREATE POLICY "Users can update spaces they own" ON public.spaces
FOR UPDATE TO authenticated USING (
    owner_user_id = (select auth.uid())
);

-- Space Members Table Policies
DROP POLICY IF EXISTS "members_owner_manage" ON public.space_members;
CREATE POLICY "members_owner_manage" ON public.space_members
FOR ALL TO authenticated USING (
    exists (
        select 1 from public.spaces
        where id = public.space_members.space_id
        and owner_user_id = (select auth.uid())
    )
);

DROP POLICY IF EXISTS "members_select_member" ON public.space_members;
CREATE POLICY "members_select_member" ON public.space_members
FOR SELECT TO authenticated USING (
    user_id = (select auth.uid())
);

-- Transactions Table Policies
DROP POLICY IF EXISTS "Users can view transactions in their spaces" ON public.transactions;
CREATE POLICY "Users can view transactions in their spaces" ON public.transactions
FOR SELECT TO authenticated USING (
    exists (
        select 1 from public.space_members
        where space_id = public.transactions.space_id
        and user_id = (select auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can insert transactions in their spaces" ON public.transactions;
CREATE POLICY "Users can insert transactions in their spaces" ON public.transactions
FOR INSERT TO authenticated WITH CHECK (
    exists (
        select 1 from public.space_members
        where space_id = public.transactions.space_id
        and user_id = (select auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can update transactions in their spaces" ON public.transactions;
CREATE POLICY "Users can update transactions in their spaces" ON public.transactions
FOR UPDATE TO authenticated USING (
    exists (
        select 1 from public.space_members
        where space_id = public.transactions.space_id
        and user_id = (select auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can delete transactions in their spaces" ON public.transactions;
CREATE POLICY "Users can delete transactions in their spaces" ON public.transactions
FOR DELETE TO authenticated USING (
    exists (
        select 1 from public.space_members
        where space_id = public.transactions.space_id
        and user_id = (select auth.uid())
    )
);

-- 3. CLEANUP PERMISSIVE/DUPLICATE POLICIES
-- The report warned about "multiple permissive policies". 
-- It often happens if we have old policies with overlapping names.
-- Dropping potential legacy names to be safe.
DROP POLICY IF EXISTS "spaces_owner_insert" ON public.spaces;
DROP POLICY IF EXISTS "spaces_owner_update" ON public.spaces;
DROP POLICY IF EXISTS "spaces_owner_delete" ON public.spaces;
DROP POLICY IF EXISTS "spaces_select_member" ON public.spaces;
