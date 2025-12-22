/*
  # Allow Sales Role Full Tender Access

  ## Overview
  This migration updates the RLS policy to allow sales users to access all tender data,
  not just tenders assigned to them.

  ## Changes
  - Drop the restrictive "Sales can view assigned tenders" policy
  - Create a new policy that allows sales users to view all tenders (same as admin)
*/

-- Drop the restrictive sales policy
DROP POLICY IF EXISTS "Sales can view assigned tenders" ON tenders;

-- Sales users can now view all tenders (same as admin)
CREATE POLICY "Sales can view all tenders"
  ON tenders FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'sale');

