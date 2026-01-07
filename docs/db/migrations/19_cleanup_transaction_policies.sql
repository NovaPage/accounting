-- File: docs/db/migrations/19_cleanup_transaction_policies.sql

-- User reported "Multiple permissive policies" for transactions.
-- We want ONLY "transactions_crud_member" to exist.
-- This script aggressively drops all other known variations.

DROP POLICY IF EXISTS "Users can view transactions in their spaces" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert transactions in their spaces" ON public.transactions;
DROP POLICY IF EXISTS "Users can update transactions in their spaces" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete transactions in their spaces" ON public.transactions;

DROP POLICY IF EXISTS "transactions_read" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;

-- Ensure our correct policy is there (re-create it independently just in case)
DROP POLICY IF EXISTS "transactions_crud_member" ON public.transactions;

CREATE POLICY "transactions_crud_member" ON public.transactions
FOR ALL TO authenticated USING (
    public.is_space_member(space_id)
);
