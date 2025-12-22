/*
  QUICK FIX: Fix Tender Search Permission Errors
  
  Run this SQL in Supabase SQL Editor to fix the "permission denied for table users" error.
  
  This changes the foreign keys from auth.users to profiles, which resolves the permission issue.
*/

-- Fix tender_search_quotas foreign key
ALTER TABLE public.tender_search_quotas 
DROP CONSTRAINT IF EXISTS tender_search_quotas_user_id_fkey;

ALTER TABLE public.tender_search_quotas
ADD CONSTRAINT tender_search_quotas_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Fix tender_search_logs foreign key
ALTER TABLE public.tender_search_logs 
DROP CONSTRAINT IF EXISTS tender_search_logs_user_id_fkey;

ALTER TABLE public.tender_search_logs
ADD CONSTRAINT tender_search_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

