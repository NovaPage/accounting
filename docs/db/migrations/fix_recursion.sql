-- Fix recursion by making the helper function SECURITY DEFINER
-- This allows it to query space_members without triggering the RLS policy on space_members again
CREATE OR REPLACE FUNCTION public.is_space_member(p_space_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM space_members
    WHERE space_id = p_space_id
    AND user_id = auth.uid()
  );
END;
$$;
