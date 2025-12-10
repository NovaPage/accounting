-- File: docs/db/migrations/07_invite_function.sql

-- Function to invite a user by email to a space
-- Security: SECURITY DEFINER to access auth.users (to resolve email -> id)
-- Access Control: Checks if the caller is an ADMIN (Owner) of the space.

create or replace function public.invite_user_by_email(
  p_space_id uuid,
  p_email text,
  p_role public.member_role default 'member'
)
returns void
language plpgsql
security definer
as $$
declare
  v_target_user_id uuid;
  v_caller_role public.member_role;
begin
  -- 1. Check if caller is a member of the space (RLS check implicit or explicit)
  --    We strictly enforce that only 'owner' can invite others for now.
  select role into v_caller_role
  from public.space_members
  where space_id = p_space_id
  and user_id = auth.uid();

  if v_caller_role is null or v_caller_role <> 'owner' then
    raise exception 'Access denied: Only owners can invite members.';
  end if;

  -- 2. Resolve email to user_id
  --    Note: This depends on auth.users table which is internal to Supabase Auth.
  select id into v_target_user_id
  from auth.users
  where email = p_email;

  if v_target_user_id is null then
    raise exception 'User not found: The email % is not registered.', p_email;
  end if;

  -- 3. Insert into space_members
  --    If already exists, do nothing or update role? Let's treat duplicate as no-op.
  if exists (
    select 1 from public.space_members
    where space_id = p_space_id and user_id = v_target_user_id
  ) then
    raise notice 'User is already a member.';
    return;
  end if;

  insert into public.space_members (space_id, user_id, role)
  values (p_space_id, v_target_user_id, p_role);

end;
$$;
