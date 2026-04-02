-- ============================================
-- Supabase Storage Policies untuk supabase-bronze-coin bucket
-- Project: Trading Dashboard
-- ============================================

-- Enable RLS on storage.objects (usually already enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policy 1: Public Read Access
-- Allow anyone to read files from the bucket
-- ============================================
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'supabase-bronze-coin' );

-- ============================================
-- Policy 2: Authenticated Upload
-- Allow authenticated users to upload files
-- ============================================
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'supabase-bronze-coin' AND
  auth.role() = 'authenticated'
);

-- ============================================
-- Policy 3: Authenticated Update (own files only)
-- Allow users to update their own uploaded files
-- (Assuming you use user ID in path like: screenshots/{userId}/...)
-- ============================================
CREATE POLICY "Authenticated Update Own Files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'supabase-bronze-coin' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Policy 4: Authenticated Delete (own files only)
-- Allow users to delete their own files
-- ============================================
CREATE POLICY "Authenticated Delete Own Files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'supabase-bronze-coin' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Alternative: If you're using service role key (server-side),
-- you don't need RLS policies because service role bypasses RLS.
-- But you still need SELECT policy for public read if files are public.
-- ============================================

-- To make the bucket publicly accessible (optional):
-- Update bucket to public if you want direct publicUrl access without auth
-- Run this in Supabase SQL Editor if you want all files publicly readable:

-- CREATE POLICY "Public Read All"
-- ON storage.objects FOR SELECT
-- USING ( bucket_id = 'supabase-bronze-coin' );

-- ============================================
-- Verify policies
-- ============================================
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE tablename = 'objects'
--   AND schemaname = 'storage'
-- ORDER BY cmd, policyname;

-- ============================================
-- Notes:
-- - Run these queries in Supabase SQL Editor (Dashboard -> SQL)
-- - Adjust folder structure matches your upload path:
--   e.g., screenshots/{userId}/{filename} uses foldername index [1] for userId
-- - If you're not using userId in path, adjust policy accordingly
-- ============================================
