/*
  # Add sale_id column to tenders table

  ## Overview
  This migration adds a `sale_id` column to the tenders table to enable filtering tender data by assigned sales person ID.
  Each sale can only access tender data where they are assigned via the sale_id.

  ## Changes
  1. Add `sale_id` column (uuid, references profiles.id)
  2. Create index on `sale_id` for performance
  3. Update RLS policies to filter by `sale_id` for sales users
*/

-- Add sale_id column to tenders table
ALTER TABLE tenders
ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for sale_id lookups
CREATE INDEX IF NOT EXISTS idx_tenders_sale_id ON tenders(sale_id);

-- Update RLS policy for sales users to filter by sale_id
-- Drop the old policy that used sales_username
DROP POLICY IF EXISTS "Sales can view assigned tenders" ON tenders;

-- Create new policy that uses sale_id for sales users
-- Sales users can see tenders where sale_id matches their user ID
-- Admin users can see all tenders (handled by existing "Admin can view all tenders" policy)
CREATE POLICY "Sales can view assigned tenders by sale_id"
  ON tenders FOR SELECT
  TO authenticated
  USING (
    -- Only apply to sales users (not admins)
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'sale'
    AND
    (
      -- Primary: match by sale_id
      sale_id = auth.uid()
      OR
      -- Fallback: match by sales_username for backward compatibility during migration
      (sale_id IS NULL AND sales_username = (SELECT split_part(email, '@', 1) FROM profiles WHERE id = auth.uid()))
    )
  );

-- Add comment to column
COMMENT ON COLUMN tenders.sale_id IS 'Reference to the sales person (profile) assigned to this tender. Sales users can only see tenders where sale_id matches their user ID.';

