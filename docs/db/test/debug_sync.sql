-- Check counts in transactions vs journals
select 'transactions' as table_name, count(*) from public.transactions
union all
select 'journals' as table_name, count(*) from public.journals
union all
select 'journal_lines' as table_name, count(*) from public.journal_lines;

-- Check for triggers on transactions
select event_object_table, trigger_name, action_statement
from information_schema.triggers
where event_object_table = 'transactions';
