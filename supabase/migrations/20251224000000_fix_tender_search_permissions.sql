/*
  # Fix Tender Search Tables Permission Issues

  ## Problem
  The tender_search_quotas and tender_search_logs tables have foreign keys 
  referencing auth.users(id), which causes "permission denied for table users" 
  errors because regular users cannot access the auth.users table.

  ## Solution
  Change foreign keys to reference profiles(id) instead, since profiles.id 
  already references auth.users(id) and is accessible to authenticated users.

  ## Important Notes
  - This migration must be run AFTER profiles table exists
  - Since profiles.id = auth.users.id, existing data remains valid
  - No data migration needed as user_id values are the same
*/

-- Fix tender_search_quotas foreign key
-- Drop existing foreign key constraint (if it references auth.users)
ALTER TABLE public.tender_search_quotas 
DROP CONSTRAINT IF EXISTS tender_search_quotas_user_id_fkey;

-- Add correct foreign key to profiles
ALTER TABLE public.tender_search_quotas
ADD CONSTRAINT tender_search_quotas_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Fix tender_search_logs foreign key
-- Drop existing foreign key constraint (if it references auth.users)
ALTER TABLE public.tender_search_logs 
DROP CONSTRAINT IF EXISTS tender_search_logs_user_id_fkey;

-- Add correct foreign key to profiles
ALTER TABLE public.tender_search_logs
ADD CONSTRAINT tender_search_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

