# Database Migrations Guide

## Overview
This project requires several database migrations to be applied to your Supabase project. The migrations create the necessary tables, policies, and functions for the application to work.

## Required Migrations

Apply migrations in this order:

1. **20251204184506_d486f72e-5fb1-4adf-ad9d-19bee2283406.sql** - Core tables (profiles, beats, storage buckets)
2. **20251205075224_4c80402b-8c95-4e85-bf21-8e0b7430aad3.sql** - Admin roles and permissions
3. **20251206000000_checkout_system.sql** - Cart, orders, licenses (REQUIRED for cart functionality)
4. **20251207000000_sync_tickets.sql** - Sync licensing tickets
5. **20251208000000_producer_wallet.sql** - Producer wallet and payout system

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Apply each migration file**
   - Copy the contents of each migration file from `supabase/migrations/`
   - Paste into the SQL Editor
   - Click "Run" to execute
   - Apply migrations in the order listed above

### Option 2: Using Supabase CLI (If you have it installed)

```bash
# Link to your Supabase project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
supabase db push
```

## Migration Details

### 1. Core Tables Migration (`20251204184506_*.sql`)
Creates:
- `profiles` table
- `beats` table
- Storage buckets (beats, covers, previews)
- Basic RLS policies

### 2. Admin Roles Migration (`20251205075224_*.sql`)
Creates:
- `user_roles` table
- `has_role()` function
- Admin permissions

### 3. Checkout System Migration (`20251206000000_checkout_system.sql`) ⚠️ REQUIRED FOR CART
Creates:
- `cart_items` table (FIXES YOUR CURRENT ERROR)
- `orders` table
- `order_items` table
- `licenses` table
- Enums: `license_type`, `order_status`, `payment_method`
- RLS policies for all tables

### 4. Sync Tickets Migration (`20251207000000_sync_tickets.sql`)
Creates:
- `sync_tickets` table
- RLS policies

### 5. Producer Wallet Migration (`20251208000000_producer_wallet.sql`)
Creates:
- `producer_wallets` table
- `producer_earnings` table
- `payout_requests` table
- Adds `stems_url` to `beats` table
- Adds `bank_transfer` to `payment_method` enum
- Triggers and functions

## Verification

After applying migrations, verify by running this query in SQL Editor:

```sql
-- Check if cart_items table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'cart_items'
);

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- beats
- cart_items ✅ (This fixes your error)
- licenses
- order_items
- orders
- payout_requests
- producer_earnings
- producer_wallets
- profiles
- sync_tickets
- user_roles

## Troubleshooting

### Error: "relation already exists"
- Some migrations may have already been applied
- Check which tables exist and skip those migrations
- Or use `CREATE TABLE IF NOT EXISTS` in your queries

### Error: "type already exists"
- Enums may already exist
- Check existing types: `SELECT typname FROM pg_type WHERE typtype = 'e';`
- Modify migration to use `CREATE TYPE IF NOT EXISTS` or skip if exists

### Error: "permission denied"
- Ensure you're using the Supabase dashboard or have proper credentials
- Some operations require superuser privileges (usually handled by Supabase)

## Quick Fix Script

If you just need to create the `cart_items` table immediately, run this in SQL Editor:

```sql
-- Create enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.license_type AS ENUM ('basic', 'premium', 'unlimited', 'exclusive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create cart_items table
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

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Cart items policies
CREATE POLICY IF NOT EXISTS "Users can view their own cart items"
ON public.cart_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own cart items"
ON public.cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own cart items"
ON public.cart_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own cart items"
ON public.cart_items FOR DELETE
USING (auth.uid() = user_id);
```

## Need Help?

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Verify your database connection
3. Ensure you have the correct permissions
4. Check that all prerequisite migrations have been applied



