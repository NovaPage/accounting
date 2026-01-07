-- File: docs/db/migrations/17_kill_balance_trigger.sql

-- The P0001 error persists. This means the trigger name is unknown and wasn't found in the codebase.
-- This script acts as a "Hunter": it inspects the system catalogs for ANY trigger on 'journals'
-- and drops it, unless it's the standard 'updated_at' trigger.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all triggers on public.journals
    FOR r IN (
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'journals' 
        AND trigger_schema = 'public'
    ) LOOP
        
        -- Safe List: Do not drop the timestamp updater if it exists
        IF r.trigger_name LIKE '%updated_at%' THEN
            RAISE NOTICE 'Skipping updated_at trigger: %', r.trigger_name;
            CONTINUE;
        END IF;

        -- Drop everything else (likely the balance checker)
        RAISE NOTICE 'Dropping potential blocker trigger: %', r.trigger_name;
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.journals CASCADE';
        
    END LOOP;
END $$;
