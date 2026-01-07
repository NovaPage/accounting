-- File: docs/db/migrations/15_fix_spaces_overlap.sql

-- 1. Drop the overlapping policies causing warnings and potential confusion.
DROP POLICY IF EXISTS "Users can view spaces they own" ON public.spaces;
DROP POLICY IF EXISTS "Users can view spaces they are members of" ON public.spaces;

-- 2. Create a single, unified READ policy for spaces.
-- Access allowed if: User is Owner OR User is Member.
CREATE POLICY "spaces_read" ON public.spaces
FOR SELECT TO authenticated USING (
    owner_user_id = (select auth.uid())
    OR
    exists (
        select 1 from public.space_members
        where space_id = public.spaces.id
        and user_id = (select auth.uid())
    )
);

-- Note: WRITE policies (insert/update) remain separate as they are owner-only.
