-- ============================================================================
-- NSIMABEATS COMPLETE DATABASE SETUP
-- ============================================================================
-- This migration sets up the entire database schema from scratch.
-- Run this in your Supabase SQL Editor for a fresh installation.
-- ============================================================================

-- ============================================================================
-- PART 1: CORE TABLES & FUNCTIONS
-- ============================================================================

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'artist' CHECK (role IN ('artist', 'producer', 'admin')),
  producer_status TEXT CHECK (producer_status IN ('pending', 'approved', 'rejected')),
  bio TEXT,
  producer_application_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create beats table
CREATE TABLE IF NOT EXISTS public.beats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  bpm INTEGER NOT NULL CHECK (bpm > 0 AND bpm < 300),
  key TEXT,
  mood TEXT,
  description TEXT,
  
  -- Pricing tiers (in USD)
  price_basic DECIMAL(10,2) NOT NULL DEFAULT 29.99,
  price_premium DECIMAL(10,2),
  price_unlimited DECIMAL(10,2),
  price_exclusive DECIMAL(10,2),
  
  -- File URLs
  audio_url TEXT NOT NULL,
  preview_url TEXT,
  cover_url TEXT,
  stems_url TEXT,
  waveform_data JSONB,
  
  -- Status (admin approval workflow)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published', 'unpublished')),
  admin_notes TEXT,
  
  -- Metadata
  plays_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  is_exclusive_sold BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Published beats are viewable by everyone" ON public.beats;
DROP POLICY IF EXISTS "Producers can view their own beats" ON public.beats;
DROP POLICY IF EXISTS "Producers can insert their own beats" ON public.beats;
DROP POLICY IF EXISTS "Producers can update their own beats" ON public.beats;
DROP POLICY IF EXISTS "Producers can delete their own pending beats" ON public.beats;

-- Beats policies
CREATE POLICY "Published beats are viewable by everyone" 
ON public.beats FOR SELECT USING (status = 'published');

CREATE POLICY "Producers can view their own beats" 
ON public.beats FOR SELECT USING (auth.uid() = producer_id);

CREATE POLICY "Producers can insert their own beats" 
ON public.beats FOR INSERT WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "Producers can update their own beats" 
ON public.beats FOR UPDATE USING (auth.uid() = producer_id);

CREATE POLICY "Producers can delete their own pending beats" 
ON public.beats FOR DELETE USING (auth.uid() = producer_id AND status = 'pending');

-- Create storage buckets (ignore if they exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('beats', 'beats', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('previews', 'previews', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Producers can upload beats" ON storage.objects;
DROP POLICY IF EXISTS "Producers can view own beats" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view previews" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload previews" ON storage.objects;

-- Storage policies for beats (private master files)
CREATE POLICY "Producers can upload beats" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'beats' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Producers can view own beats" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'beats' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for covers (public)
CREATE POLICY "Anyone can view covers" 
ON storage.objects FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Authenticated users can upload covers" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');

-- Storage policies for previews (public)
CREATE POLICY "Anyone can view previews" 
ON storage.objects FOR SELECT USING (bucket_id = 'previews');

CREATE POLICY "Authenticated users can upload previews" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'previews' AND auth.role() = 'authenticated');

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_beats_updated_at ON public.beats;

-- Triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beats_updated_at
BEFORE UPDATE ON public.beats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 2: ADMIN ROLES & PERMISSIONS
-- ============================================================================

-- Create enum for roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all beats" ON public.beats;
DROP POLICY IF EXISTS "Admins can update any beat" ON public.beats;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Admin policies for beats table
CREATE POLICY "Admins can view all beats"
ON public.beats
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any beat"
ON public.beats
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for profiles table
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- PART 3: CHECKOUT SYSTEM (Cart, Orders, Licenses)
-- ============================================================================

-- Create enum for license types
DO $$ BEGIN
    CREATE TYPE public.license_type AS ENUM ('basic', 'premium', 'unlimited', 'exclusive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for order status
DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for payment method
DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM ('card', 'mpamba', 'airtel_money', 'other', 'bank_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add bank_transfer to payment_method enum if it doesn't exist
DO $$ BEGIN
    ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'bank_transfer';
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

-- Enable RLS for cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;

-- Cart items policies
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

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_method public.payment_method,
  payment_reference TEXT,
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- Orders policies
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
ON public.orders FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
  license_type public.license_type NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for their own orders" ON public.order_items;

-- Order items policies
CREATE POLICY "Users can view their own order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
ON public.order_items FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

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

-- Create licenses table (tracks purchased licenses)
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  license_type public.license_type NOT NULL,
  audio_url TEXT NOT NULL,
  license_document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for licenses
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can view all licenses" ON public.licenses;
DROP POLICY IF EXISTS "Users can insert their own licenses" ON public.licenses;

-- Licenses policies
CREATE POLICY "Users can view their own licenses"
ON public.licenses FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all licenses
CREATE POLICY "Admins can view all licenses"
ON public.licenses FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert licenses for themselves
CREATE POLICY "Users can insert their own licenses"
ON public.licenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_beat_id ON public.cart_items(beat_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_beat_id ON public.order_items(beat_id);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON public.licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_beat_id ON public.licenses(beat_id);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;

-- Add triggers for updated_at
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 4: SYNC LICENSING TICKETS
-- ============================================================================

-- Create sync_tickets table for licensing requests
CREATE TABLE IF NOT EXISTS public.sync_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company/NGO Information
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Project Details
  project_type TEXT NOT NULL CHECK (project_type IN ('Corporate', 'NGO', 'Film/TV', 'Documentary', 'Advocacy', 'Other')),
  campaign_duration TEXT NOT NULL,
  territory TEXT NOT NULL,
  budget_range TEXT NOT NULL,
  music_type_mood TEXT,
  deadline DATE,
  
  -- Additional notes/campaign brief
  campaign_brief TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'quoted', 'approved', 'rejected', 'completed')),
  
  -- Admin fields
  admin_notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Optional user link if logged in
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.sync_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create sync tickets" ON public.sync_tickets;
DROP POLICY IF EXISTS "Users can view their own sync tickets" ON public.sync_tickets;
DROP POLICY IF EXISTS "Admins can view all sync tickets" ON public.sync_tickets;
DROP POLICY IF EXISTS "Admins can update sync tickets" ON public.sync_tickets;

-- Policies
CREATE POLICY "Anyone can create sync tickets"
ON public.sync_tickets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own sync tickets"
ON public.sync_tickets FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins can view all sync tickets"
ON public.sync_tickets FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins can update sync tickets"
ON public.sync_tickets FOR UPDATE
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sync_tickets_status ON public.sync_tickets(status);
CREATE INDEX IF NOT EXISTS idx_sync_tickets_created_at ON public.sync_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_tickets_user_id ON public.sync_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_tickets_email ON public.sync_tickets(email);

-- Function to update updated_at for sync_tickets
CREATE OR REPLACE FUNCTION update_sync_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_tickets_updated_at ON public.sync_tickets;

-- Trigger to update updated_at
CREATE TRIGGER sync_tickets_updated_at
BEFORE UPDATE ON public.sync_tickets
FOR EACH ROW
EXECUTE FUNCTION update_sync_tickets_updated_at();

-- ============================================================================
-- PART 5: PRODUCER WALLET & PAYOUT SYSTEM
-- ============================================================================

-- Create producer_wallets table to track earnings
CREATE TABLE IF NOT EXISTS public.producer_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  available_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pending_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_paid_out DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(producer_id)
);

-- Create producer_earnings table to track individual earnings from sales
CREATE TABLE IF NOT EXISTS public.producer_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
  sale_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  earnings_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'reversed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payout_requests table
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  payout_method TEXT NOT NULL CHECK (payout_method IN ('bank_transfer', 'mpamba', 'airtel_money', 'paypal', 'other')),
  payout_details JSONB NOT NULL,
  admin_notes TEXT,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.producer_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producer_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Producers can view own wallet" ON public.producer_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.producer_wallets;
DROP POLICY IF EXISTS "Admins can update any wallet" ON public.producer_wallets;
DROP POLICY IF EXISTS "Producers can view own earnings" ON public.producer_earnings;
DROP POLICY IF EXISTS "Admins can view all earnings" ON public.producer_earnings;
DROP POLICY IF EXISTS "Admins can update any earnings" ON public.producer_earnings;
DROP POLICY IF EXISTS "Producers can create their own payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Producers can view their own payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can view all payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can update any payout request" ON public.payout_requests;

-- Producer wallets policies
CREATE POLICY "Producers can view own wallet"
ON public.producer_wallets FOR SELECT
USING (auth.uid() = producer_id);

CREATE POLICY "Admins can view all wallets"
ON public.producer_wallets FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any wallet"
ON public.producer_wallets FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Producer earnings policies
CREATE POLICY "Producers can view own earnings"
ON public.producer_earnings FOR SELECT
USING (auth.uid() = producer_id);

CREATE POLICY "Admins can view all earnings"
ON public.producer_earnings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any earnings"
ON public.producer_earnings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Payout requests policies
CREATE POLICY "Producers can create their own payout requests"
ON public.payout_requests FOR INSERT
WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "Producers can view their own payout requests"
ON public.payout_requests FOR SELECT
USING (auth.uid() = producer_id);

CREATE POLICY "Admins can view all payout requests"
ON public.payout_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any payout request"
ON public.payout_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_producer_earnings_producer_id ON public.producer_earnings(producer_id);
CREATE INDEX IF NOT EXISTS idx_producer_earnings_status ON public.producer_earnings(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_producer_id ON public.payout_requests(producer_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_producer_wallets_updated_at ON public.producer_wallets;
DROP TRIGGER IF EXISTS update_payout_requests_updated_at ON public.payout_requests;
DROP TRIGGER IF EXISTS create_wallet_on_producer_approval ON public.profiles;

-- Add triggers for updated_at
CREATE TRIGGER update_producer_wallets_updated_at
BEFORE UPDATE ON public.producer_wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payout_requests_updated_at
BEFORE UPDATE ON public.payout_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create wallet when producer is approved
CREATE OR REPLACE FUNCTION public.create_producer_wallet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'producer' AND NEW.producer_status = 'approved' THEN
    INSERT INTO public.producer_wallets (producer_id)
    VALUES (NEW.id)
    ON CONFLICT (producer_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet when producer is approved
CREATE TRIGGER create_wallet_on_producer_approval
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.producer_status IS DISTINCT FROM NEW.producer_status AND NEW.producer_status = 'approved')
EXECUTE FUNCTION public.create_producer_wallet();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables were created
SELECT 
    'Database setup complete!' as status,
    COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles', 'beats', 'cart_items', 'orders', 'order_items', 
    'licenses', 'sync_tickets', 'producer_wallets', 
    'producer_earnings', 'payout_requests', 'user_roles'
);

-- List all created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

