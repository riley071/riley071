-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'artist' CHECK (role IN ('artist', 'producer', 'admin')),
  producer_status TEXT CHECK (producer_status IN ('pending', 'approved', 'rejected')),
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create beats table
CREATE TABLE public.beats (
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

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('beats', 'beats', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('previews', 'previews', true);

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
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

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

-- Triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beats_updated_at
BEFORE UPDATE ON public.beats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();