/*
  # Update Tender Analytics RLS Policies

  ## Overview
  This migration updates the RLS policies for tender analytics tables to integrate with the existing profiles table and role system.

  ## Changes
  1. Drop old RLS policies that used email-based checks
  2. Create new policies that use the profiles.role column
  3. Update tender data access to match sales_username with profile email
  4. Admin users get full access to all features
  5. Sales users get access to their own tender data with quota limits

  ## Security Model
  - **Admin users** (role='admin'): Full access to all tenders, quotas, and logs
  - **Sales users** (role='sale'): Access only to tenders where sales_username matches their email username, with quota enforcement
*/

-- Drop existing policies for tenders
DROP POLICY IF EXISTS "Super user can view all tenders" ON tenders;
DROP POLICY IF EXISTS "Sales users can view own tenders" ON tenders;
DROP POLICY IF EXISTS "Admin can view all tenders" ON tenders;

-- Drop existing policies for tender_search_quotas
DROP POLICY IF EXISTS "Users can view own quota" ON tender_search_quotas;
DROP POLICY IF EXISTS "Users can insert own quota" ON tender_search_quotas;
DROP POLICY IF EXISTS "Users can update own quota" ON tender_search_quotas;
DROP POLICY IF EXISTS "Admin can view all quotas" ON tender_search_quotas;
DROP POLICY IF EXISTS "Admin can update all quotas" ON tender_search_quotas;

-- Drop existing policies for tender_search_logs
DROP POLICY IF EXISTS "Users can view own search logs" ON tender_search_logs;
DROP POLICY IF EXISTS "Users can insert own search logs" ON tender_search_logs;
DROP POLICY IF EXISTS "Admin can view all search logs" ON tender_search_logs;

-- Create new RLS policies for tenders table
-- Admin can view all tenders
CREATE POLICY "Admin can view all tenders"
  ON tenders FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Sales users can view tenders matching their username
CREATE POLICY "Sales can view assigned tenders"
  ON tenders FOR SELECT
  TO authenticated
  USING (
    sales_username = (SELECT split_part(email, '@', 1) FROM profiles WHERE id = auth.uid())
  );

-- Admin can insert tenders
CREATE POLICY "Admin can insert tenders"
  ON tenders FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin can update tenders
CREATE POLICY "Admin can update tenders"
  ON tenders FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin can delete tenders
CREATE POLICY "Admin can delete tenders"
  ON tenders FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create new RLS policies for tender_search_quotas table
-- Users can view their own quota
CREATE POLICY "Users can view own quota"
  ON tender_search_quotas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own quota
CREATE POLICY "Users can insert own quota"
  ON tender_search_quotas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own quota
CREATE POLICY "Users can update own quota"
  ON tender_search_quotas FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin can view all quotas
CREATE POLICY "Admin can view all quotas"
  ON tender_search_quotas FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin can update all quotas
CREATE POLICY "Admin can update all quotas"
  ON tender_search_quotas FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin can delete quotas
CREATE POLICY "Admin can delete quotas"
  ON tender_search_quotas FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create new RLS policies for tender_search_logs table
-- Users can view their own search logs
CREATE POLICY "Users can view own search logs"
  ON tender_search_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own search logs
CREATE POLICY "Users can insert own search logs"
  ON tender_search_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin can view all search logs
CREATE POLICY "Admin can view all search logs"
  ON tender_search_logs FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin can delete search logs
CREATE POLICY "Admin can delete search logs"
  ON tender_search_logs FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
