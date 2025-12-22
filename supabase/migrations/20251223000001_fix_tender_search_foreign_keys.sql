/*
  # Fix Foreign Keys for Tender Search Tables
  
  This script fixes the foreign key references from auth.users to profiles
  to resolve "permission denied for table users" errors.
  
  Run this if the tables already exist with wrong foreign keys.
  If tables don't exist, run create_tender_search_tables_complete.sql instead.
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

