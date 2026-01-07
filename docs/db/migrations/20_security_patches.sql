-- File: docs/db/migrations/20_security_patches.sql

-- Fix "function has a role mutable search_path" security warning.
-- For check_journal_balance (the dummy bypass function)

CREATE OR REPLACE FUNCTION public.check_journal_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- BYPASS: Always approve.
  RETURN NEW;
END;
$$;
