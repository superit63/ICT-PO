/*
  # Complete Setup for Tender Search Quotas and Logs Tables
  
  This script creates the tender_search_quotas and tender_search_logs tables
  with all necessary indexes and RLS policies.
  
  IMPORTANT: This script fixes the foreign key to reference profiles(id) 
  instead of auth.users(id) to avoid permission issues.
  
  Run this in Supabase SQL Editor.
*/

-- Drop existing tables if they have wrong foreign keys (optional - comment out if you want to keep data)
-- DROP TABLE IF EXISTS public.tender_search_logs CASCADE;
-- DROP TABLE IF EXISTS public.tender_search_quotas CASCADE;

-- Create tender_search_quotas table
-- Note: References profiles(id) instead of auth.users(id) to avoid permission issues
CREATE TABLE IF NOT EXISTS public.tender_search_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  searches_used integer DEFAULT 0,
  searches_limit integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create index for quota lookups
CREATE INDEX IF NOT EXISTS idx_tender_search_quotas_user_date 
  ON public.tender_search_quotas(user_id, date);

-- Create tender_search_logs table
-- Note: References profiles(id) instead of auth.users(id) to avoid permission issues
CREATE TABLE IF NOT EXISTS public.tender_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_filter text,
  manufacturer_filter text,
  product_filter text,
  results_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for search logs
CREATE INDEX IF NOT EXISTS idx_tender_search_logs_user_id 
  ON public.tender_search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tender_search_logs_created_at 
  ON public.tender_search_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.tender_search_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_search_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own quota" ON public.tender_search_quotas;
DROP POLICY IF EXISTS "Users can insert own quota" ON public.tender_search_quotas;
DROP POLICY IF EXISTS "Users can update own quota" ON public.tender_search_quotas;
DROP POLICY IF EXISTS "Admin can view all quotas" ON public.tender_search_quotas;
DROP POLICY IF EXISTS "Admin can update all quotas" ON public.tender_search_quotas;
DROP POLICY IF EXISTS "Admin can delete quotas" ON public.tender_search_quotas;

DROP POLICY IF EXISTS "Users can view own search logs" ON public.tender_search_logs;
DROP POLICY IF EXISTS "Users can insert own search logs" ON public.tender_search_logs;
DROP POLICY IF EXISTS "Admin can view all search logs" ON public.tender_search_logs;
DROP POLICY IF EXISTS "Admin can delete search logs" ON public.tender_search_logs;

-- RLS Policies for tender_search_quotas table
-- Users can view their own quota
CREATE POLICY "Users can view own quota"
  ON public.tender_search_quotas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own quota
CREATE POLICY "Users can insert own quota"
  ON public.tender_search_quotas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own quota
CREATE POLICY "Users can update own quota"
  ON public.tender_search_quotas FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin can view all quotas
CREATE POLICY "Admin can view all quotas"
  ON public.tender_search_quotas FOR SELECT
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Admin can update all quotas
CREATE POLICY "Admin can update all quotas"
  ON public.tender_search_quotas FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Admin can delete quotas
CREATE POLICY "Admin can delete quotas"
  ON public.tender_search_quotas FOR DELETE
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for tender_search_logs table
-- Users can view their own search logs
CREATE POLICY "Users can view own search logs"
  ON public.tender_search_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own search logs
CREATE POLICY "Users can insert own search logs"
  ON public.tender_search_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin can view all search logs
CREATE POLICY "Admin can view all search logs"
  ON public.tender_search_logs FOR SELECT
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Admin can delete search logs
CREATE POLICY "Admin can delete search logs"
  ON public.tender_search_logs FOR DELETE
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.tender_search_quotas TO authenticated;
GRANT ALL ON public.tender_search_logs TO authenticated;

