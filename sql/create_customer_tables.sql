
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
