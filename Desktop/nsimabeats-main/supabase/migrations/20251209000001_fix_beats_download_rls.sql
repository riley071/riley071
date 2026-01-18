-- Fix storage RLS policies to allow license holders to download beats
-- Users who have purchased a license should be able to download the beat

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "License holders can download purchased beats" ON storage.objects;

-- Add policy: Users can download beats they have a license for
-- This policy matches the storage object name with the audio_url stored in beats/licenses tables
-- It handles both storage paths (new format) and full URLs (legacy format)
CREATE POLICY "License holders can download purchased beats"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'beats' AND
  EXISTS (
    SELECT 1 
    FROM public.licenses
    INNER JOIN public.beats ON beats.id = licenses.beat_id
    WHERE (
      -- Match if audio_url exactly equals the storage object name (new format: "user-id/timestamp-filename.mp3")
      beats.audio_url = storage.objects.name
      OR
      licenses.audio_url = storage.objects.name
      OR
      -- Match if audio_url ends with the storage object name (handles full URLs like https://.../beats/path)
      beats.audio_url LIKE '%/' || storage.objects.name
      OR
      licenses.audio_url LIKE '%/' || storage.objects.name
      OR
      -- Match if audio_url contains the storage path (for URLs like https://.../storage/v1/object/public/beats/path)
      (beats.audio_url LIKE '%/beats/%' AND storage.objects.name = substring(beats.audio_url from '/beats/([^?]+)'))
      OR
      (licenses.audio_url LIKE '%/beats/%' AND storage.objects.name = substring(licenses.audio_url from '/beats/([^?]+)'))
    )
    AND licenses.user_id = auth.uid()
  )
);

-- Also allow producers to download their own beats (for admin/producer dashboard)
-- The existing "Producers can view own beats" policy should cover this

