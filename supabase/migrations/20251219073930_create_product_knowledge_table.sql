/*
  # Create Product Knowledge Base Tables
  
  1. New Tables
    - `product_knowledge`
      - `id` (uuid, primary key)
      - `product_id` (text) - Product identifier (e.g., "sp_a", "sp_b")
      - `title` (text) - Document title
      - `content` (text) - Markdown content with product information
      - `category` (text) - Category for organization
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `product_knowledge` table
    - Add policy for authenticated users to read product knowledge
    - Add policy for admin users to manage product knowledge
*/

CREATE TABLE IF NOT EXISTS product_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_knowledge_product_id ON product_knowledge(product_id);
CREATE INDEX IF NOT EXISTS idx_product_knowledge_category ON product_knowledge(category);

ALTER TABLE product_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view product knowledge"
  ON product_knowledge FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can insert product knowledge"
  ON product_knowledge FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update product knowledge"
  ON product_knowledge FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete product knowledge"
  ON product_knowledge FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
