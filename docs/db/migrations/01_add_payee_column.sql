-- Add payee column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN payee text;

-- Comment on column
COMMENT ON COLUMN public.transactions.payee IS 'Name of the person/entity paid (expense) or payer (income)';
