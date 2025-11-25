-- Function to sync transactions to journals
CREATE OR REPLACE FUNCTION public.sync_transaction_to_journal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_journal_id uuid;
  v_currency_code text;
  v_direction public.line_direction;
BEGIN
  -- 1. Get Space Currency
  SELECT coalesce(currency_code, 'COP')
  INTO v_currency_code
  FROM public.spaces
  WHERE id = NEW.space_id;

  -- 2. Create Journal
  INSERT INTO public.journals (
    space_id,
    journal_date,
    memo,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    NEW.space_id,
    NEW.date,
    NEW.description,
    auth.uid(),
    now(),
    now()
  ) RETURNING id INTO v_journal_id;

  -- 3. Determine Direction
  -- Income = Debit (Increase Asset)
  -- Expense = Credit (Decrease Asset)
  IF NEW.type = 'income' THEN
    v_direction := 'debit';
  ELSE
    v_direction := 'credit';
  END IF;

  -- 4. Create Journal Line
  INSERT INTO public.journal_lines (
    journal_id,
    account_id,
    category_id,
    memo,
    amount_original,
    amount_space,
    currency_original,
    fx_rate_to_space,
    direction,
    created_at,
    updated_at
  ) VALUES (
    v_journal_id,
    NEW.account_id,
    NEW.category_id,
    NEW.description,
    NEW.amount, -- amount_original
    NEW.amount, -- amount_space (assuming 1:1 for now)
    v_currency_code,
    1.0, -- fx_rate
    v_direction,
    now(),
    now()
  );

  RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS trg_sync_transaction_to_journal ON public.transactions;

CREATE TRIGGER trg_sync_transaction_to_journal
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_transaction_to_journal();
