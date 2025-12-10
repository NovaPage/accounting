-- File: docs/db/migrations/08_fix_invite_and_rls.sql

-- 1. Create the invite_user_by_email function (Security Definer to lookup emails)
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
  -- Check if caller is owner
  select role into v_caller_role
  from public.space_members
  where space_id = p_space_id
  and user_id = auth.uid();

  if v_caller_role is null or v_caller_role <> 'owner' then
    raise exception 'Access denied: Only owners can invite members.';
  end if;

  -- Resolve email to user_id
  select id into v_target_user_id
  from auth.users
  where email = p_email;

  if v_target_user_id is null then
    raise exception 'User not found: The email % is not registered.', p_email;
  end if;

  -- Check existence
  if exists (
    select 1 from public.space_members
    where space_id = p_space_id and user_id = v_target_user_id
  ) then
    raise notice 'User is already a member.';
    return;
  end if;

  -- Insert member
  insert into public.space_members (space_id, user_id, role)
  values (p_space_id, v_target_user_id, p_role);
end;
$$;

-- 2. Fix Spaces RLS Policies
-- Enable RLS on spaces just in case
alter table public.spaces enable row level security;

-- Allow users to INSERT new spaces (authenticated users)
drop policy if exists "Users can insert their own spaces" on public.spaces;
create policy "Users can insert their own spaces"
on public.spaces
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
);

-- Ensure users can SELECT spaces they own
drop policy if exists "Users can view spaces they own" on public.spaces;
create policy "Users can view spaces they own"
on public.spaces
for select
using (
  owner_user_id = auth.uid()
);

-- Allow users to UPDATE spaces they own
drop policy if exists "Users can update spaces they own" on public.spaces;
create policy "Users can update spaces they own"
on public.spaces
for update
using (
  owner_user_id = auth.uid()
);
