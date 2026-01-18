-- Create sync_tickets table for licensing requests
CREATE TABLE public.sync_tickets (
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
CREATE INDEX idx_sync_tickets_status ON public.sync_tickets(status);
CREATE INDEX idx_sync_tickets_created_at ON public.sync_tickets(created_at DESC);
CREATE INDEX idx_sync_tickets_user_id ON public.sync_tickets(user_id);
CREATE INDEX idx_sync_tickets_email ON public.sync_tickets(email);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_sync_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_tickets_updated_at
BEFORE UPDATE ON public.sync_tickets
FOR EACH ROW
EXECUTE FUNCTION update_sync_tickets_updated_at();

