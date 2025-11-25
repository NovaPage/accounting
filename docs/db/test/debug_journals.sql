select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'journals';

select enum_range(null::public.line_direction);
