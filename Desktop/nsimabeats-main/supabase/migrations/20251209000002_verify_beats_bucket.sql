-- Verify and ensure beats bucket exists and is configured correctly
-- This migration ensures the beats bucket is set up properly

-- Check if beats bucket exists, create if it doesn't
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('beats', 'beats', false, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/flac'])
ON CONFLICT (id) DO UPDATE
SET 
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/flac'];

-- Verify the bucket was created/updated
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'beats') THEN
    RAISE EXCEPTION 'Failed to create beats bucket';
  END IF;
END $$;

