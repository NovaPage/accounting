-- File: docs/db/migrations/14_fix_spaces_policy.sql

-- 1. Restore policy for members to see their spaces.
-- The previous migration removed 'spaces_select_member' but didn't replace it with an equivalent for non-owners.
-- This allows any authenticated user to SELECT a space if they are a member of it.

CREATE POLICY "Users can view spaces they are members of" ON public.spaces
FOR SELECT TO authenticated USING (
    exists (
        select 1 from public.space_members
        where space_id = public.spaces.id
        and user_id = (select auth.uid())
    )
);

-- Note: We already have "Users can view spaces they own", so this is additive.
-- RLS uses OR logic between policies, so (Owner OR Member) = Visible.
