-- Add image_url column to todos table for multimodal attachment support
ALTER TABLE todos ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create Supabase Storage bucket for todo images
-- Run this in the Supabase Dashboard > Storage (if not already created):
--   Bucket name: todo-images
--   Public bucket: true
--
-- Recommended RLS policies for the bucket:
--   INSERT: allow authenticated users to upload
--   SELECT: allow public read
--   DELETE: allow authenticated users to delete their own files
