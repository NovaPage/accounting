-- Backfill journals for existing transactions
DO $$
DECLARE
  t record;
  v_journal_id uuid;
  v_currency_code text;
  v_direction public.line_direction;
BEGIN
  FOR t IN SELECT * FROM public.transactions LOOP
    -- Check if journal already exists (heuristic: same space, date, description, created within 1 sec? 
    -- Or just assume if we are running this, we want to backfill all since count was 0)
    -- For safety, let's just do it.

    -- 1. Get Space Currency
    SELECT coalesce(currency_code, 'COP')
    INTO v_currency_code
    FROM public.spaces
    WHERE id = t.space_id;

    -- 2. Create Journal
    INSERT INTO public.journals (
      space_id,
      journal_date,
      memo,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      t.space_id,
      t.date,
      t.description,
      auth.uid(),
      t.created_at,
      now()
    ) RETURNING id INTO v_journal_id;

    -- 3. Determine Direction
    IF t.type = 'income' THEN
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
      t.account_id,
      t.category_id,
      t.description,
      t.amount,
      t.amount,
      v_currency_code,
      1.0,
      v_direction,
      t.created_at,
      now()
    );
  END LOOP;
END;
$$;
