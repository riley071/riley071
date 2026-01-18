-- Create producer_wallets table to track earnings
CREATE TABLE public.producer_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  available_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pending_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_paid_out DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create producer_earnings table to track individual earnings from sales
CREATE TABLE public.producer_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
  sale_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  earnings_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_out_at TIMESTAMP WITH TIME ZONE
);

-- Create payout_requests table
CREATE TABLE public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  payout_method TEXT NOT NULL CHECK (payout_method IN ('bank_transfer', 'mpamba', 'airtel_money', 'paypal', 'other')),
  payout_details JSONB,
  admin_notes TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.producer_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producer_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Producer wallets policies
CREATE POLICY "Producers can view own wallet"
ON public.producer_wallets FOR SELECT
USING (auth.uid() = producer_id);

CREATE POLICY "Admins can view all wallets"
ON public.producer_wallets FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Producer earnings policies
CREATE POLICY "Producers can view own earnings"
ON public.producer_earnings FOR SELECT
USING (auth.uid() = producer_id);

CREATE POLICY "Admins can view all earnings"
ON public.producer_earnings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Payout requests policies
CREATE POLICY "Producers can view own payout requests"
ON public.payout_requests FOR SELECT
USING (auth.uid() = producer_id);

CREATE POLICY "Producers can create payout requests"
ON public.payout_requests FOR INSERT
WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "Admins can view all payout requests"
ON public.payout_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payout requests"
ON public.payout_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_producer_earnings_producer_id ON public.producer_earnings(producer_id);
CREATE INDEX idx_producer_earnings_status ON public.producer_earnings(status);
CREATE INDEX idx_payout_requests_producer_id ON public.payout_requests(producer_id);
CREATE INDEX idx_payout_requests_status ON public.payout_requests(status);

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

-- Update payment_method enum to include bank_transfer
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'bank_transfer';

-- Add stems_url to beats table
ALTER TABLE public.beats ADD COLUMN IF NOT EXISTS stems_url TEXT;

