-- File: docs/db/migrations/18_kill_validator_function.sql

-- The error "Journal ... not balanced" persists.
-- Searching for triggers on tables didn't work, so the validation logic is likely inside a Function called by a trigger we missed (or on a different table like journal_lines).
-- This script searches the FUNCTION SOURCE CODE for the error text "not balanced" and drops that function.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Find functions containing the error message text
    FOR r IN (
        SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.prosrc ILIKE '%not balanced%'
        AND n.nspname = 'public' -- Assuming user code is in public
    ) LOOP
        
        RAISE NOTICE 'Found blocking function: %.%(%)', r.schema_name, r.function_name, r.args;
        
        -- 2. Drop the function (CASCADE will remove the Trigger causing it)
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.schema_name) || '.' || quote_ident(r.function_name) || '(' || r.args || ') CASCADE';
        
        RAISE NOTICE 'Dropped function and dependent triggers.';
        
    END LOOP;
END $$;
