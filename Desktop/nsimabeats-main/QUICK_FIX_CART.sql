-- QUICK FIX: Create cart_items table and required types
-- Run this in Supabase SQL Editor if you're getting "cart_items table not found" error

-- Step 1: Create license_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.license_type AS ENUM ('basic', 'premium', 'unlimited', 'exclusive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create order_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create payment_method enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM ('card', 'mpamba', 'airtel_money', 'other', 'bank_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 4: Create cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
  license_type public.license_type NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, beat_id, license_type)
);

-- Step 5: Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;

-- Step 7: Create RLS policies
CREATE POLICY "Users can view their own cart items"
ON public.cart_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items"
ON public.cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
ON public.cart_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
ON public.cart_items FOR DELETE
USING (auth.uid() = user_id);

-- Step 8: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_beat_id ON public.cart_items(beat_id);

-- Step 9: Create trigger for updated_at (if function exists)
DO $$ BEGIN
    CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
    WHEN undefined_function THEN
        RAISE NOTICE 'update_updated_at_column function does not exist. Skipping trigger creation.';
    WHEN duplicate_object THEN null;
END $$;

-- Verification query - run this to confirm it worked
SELECT 
    'cart_items table created successfully!' as status,
    COUNT(*) as existing_rows
FROM public.cart_items;



