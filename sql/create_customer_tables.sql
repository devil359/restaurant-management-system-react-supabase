
CREATE OR REPLACE FUNCTION public.create_customer_notes_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create customer_notes table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
    content TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  );
  
  -- Add RLS policies to the table
  ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist to avoid errors
  DROP POLICY IF EXISTS "Users can view their restaurant's customer notes" ON public.customer_notes;
  DROP POLICY IF EXISTS "Users can insert their restaurant's customer notes" ON public.customer_notes;
  DROP POLICY IF EXISTS "Users can delete their restaurant's customer notes" ON public.customer_notes;
  
  -- Create RLS policies
  CREATE POLICY "Users can view their restaurant's customer notes"
    ON public.customer_notes FOR SELECT
    USING ((SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()) = restaurant_id);
  
  CREATE POLICY "Users can insert their restaurant's customer notes"
    ON public.customer_notes FOR INSERT
    WITH CHECK ((SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()) = restaurant_id);
  
  CREATE POLICY "Users can delete their restaurant's customer notes"
    ON public.customer_notes FOR DELETE
    USING ((SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()) = restaurant_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_customer_activities_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create customer_activities table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.customer_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
    activity_type TEXT NOT NULL, -- 'note_added', 'email_sent', 'order_placed', 'tag_added', 'tag_removed', 'promotion_sent'
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  );
  
  -- Add RLS policies to the table
  ALTER TABLE public.customer_activities ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist to avoid errors
  DROP POLICY IF EXISTS "Users can view their restaurant's customer activities" ON public.customer_activities;
  DROP POLICY IF EXISTS "Users can insert their restaurant's customer activities" ON public.customer_activities;
  
  -- Create RLS policies
  CREATE POLICY "Users can view their restaurant's customer activities"
    ON public.customer_activities FOR SELECT
    USING ((SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()) = restaurant_id);
  
  CREATE POLICY "Users can insert their restaurant's customer activities"
    ON public.customer_activities FOR INSERT
    WITH CHECK ((SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()) = restaurant_id);
END;
$$;

-- Create new database functions to allow type-safe operations
CREATE OR REPLACE FUNCTION public.get_customer_notes(customer_id_param UUID)
RETURNS SETOF customer_notes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.customer_notes
  WHERE customer_id = customer_id_param
  ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_customer_activities(customer_id_param UUID)
RETURNS SETOF customer_activities
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.customer_activities
  WHERE customer_id = customer_id_param
  ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_customer_note(
  customer_id_param UUID,
  restaurant_id_param UUID,
  content_param TEXT,
  created_by_param TEXT
)
RETURNS customer_notes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_note customer_notes;
BEGIN
  -- Insert the note
  INSERT INTO public.customer_notes(
    customer_id,
    restaurant_id,
    content,
    created_by
  )
  VALUES (
    customer_id_param,
    restaurant_id_param,
    content_param,
    created_by_param
  )
  RETURNING * INTO new_note;
  
  RETURN new_note;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_customer_activity(
  customer_id_param UUID,
  restaurant_id_param UUID,
  activity_type_param TEXT,
  description_param TEXT
)
RETURNS customer_activities
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity customer_activities;
BEGIN
  -- Insert the activity
  INSERT INTO public.customer_activities(
    customer_id,
    restaurant_id,
    activity_type,
    description
  )
  VALUES (
    customer_id_param,
    restaurant_id_param,
    activity_type_param,
    description_param
  )
  RETURNING * INTO new_activity;
  
  RETURN new_activity;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_loyalty_transactions(customer_id_param UUID)
RETURNS SETOF loyalty_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.loyalty_transactions
  WHERE customer_id = customer_id_param
  ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_loyalty_transaction(
  customer_id_param UUID,
  restaurant_id_param UUID,
  transaction_type_param TEXT,
  points_param INTEGER,
  source_param TEXT,
  notes_param TEXT,
  created_by_param UUID
)
RETURNS loyalty_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_transaction loyalty_transactions;
BEGIN
  -- Insert the transaction
  INSERT INTO public.loyalty_transactions(
    customer_id,
    restaurant_id,
    transaction_type,
    points,
    source,
    notes,
    created_by
  )
  VALUES (
    customer_id_param,
    restaurant_id_param,
    transaction_type_param,
    points_param,
    source_param,
    notes_param,
    created_by_param
  )
  RETURNING * INTO new_transaction;
  
  RETURN new_transaction;
END;
$$;
