-- File: docs/db/migrations/13_fix_policy_overlap.sql

-- Resolve "multiple permissive policies" warning for space_members.
-- Strategy: Split the 'ALL' policy into explicit 'READ' and 'WRITE' policies
-- so that there is only exactly ONE policy active for SELECT.

-- 1. Drop existing overlapping policies
DROP POLICY IF EXISTS "members_owner_manage" ON public.space_members;
DROP POLICY IF EXISTS "members_select_member" ON public.space_members;

-- 2. Create Unified SELECT Policy
-- Allowing access if: User is Owner OR User is the Member itself
CREATE POLICY "members_read" ON public.space_members
FOR SELECT TO authenticated USING (
    -- Access Strategy 1: User is the Member
    user_id = (select auth.uid())
    OR
    -- Access Strategy 2: User is the Owner of the space
    exists (
        select 1 from public.spaces
        where id = public.space_members.space_id
        and owner_user_id = (select auth.uid())
    )
);

-- 3. Create Modification Policy (Owner Only)
-- Covers INSERT, UPDATE, DELETE
CREATE POLICY "members_write" ON public.space_members
FOR INSERT TO authenticated WITH CHECK (
    exists (
        select 1 from public.spaces
        where id = public.space_members.space_id
        and owner_user_id = (select auth.uid())
    )
);

CREATE POLICY "members_modify" ON public.space_members
FOR UPDATE TO authenticated USING (
    exists (
        select 1 from public.spaces
        where id = public.space_members.space_id
        and owner_user_id = (select auth.uid())
    )
);

CREATE POLICY "members_delete" ON public.space_members
FOR DELETE TO authenticated USING (
    exists (
        select 1 from public.spaces
        where id = public.space_members.space_id
        and owner_user_id = (select auth.uid())
    )
);
