-- List all triggers on accounts and transactions tables
SELECT 
    event_object_table as table_name, 
    trigger_name, 
    action_timing, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_table IN ('accounts', 'transactions')
ORDER BY event_object_table, trigger_name;

-- List source code of functions that might be involved
SELECT 
    p.proname as function_name, 
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (
    p.proname LIKE '%account%' 
    OR p.proname LIKE '%transaction%' 
    OR p.proname LIKE '%update%'
);
