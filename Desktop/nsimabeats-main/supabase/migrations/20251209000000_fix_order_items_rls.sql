-- Fix RLS policies for order_items and licenses tables
-- This migration adds missing INSERT policies that are required for checkout functionality

-- Add INSERT policy for order_items
-- Users can insert order_items for orders they own
CREATE POLICY "Users can insert order items for their own orders"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Add INSERT policy for licenses
-- Users can insert licenses for themselves
CREATE POLICY "Users can insert their own licenses"
ON public.licenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

