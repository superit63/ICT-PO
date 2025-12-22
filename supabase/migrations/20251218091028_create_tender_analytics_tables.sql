/*
  # Create Tender Analytics Tables

  ## Overview
  This migration creates the database schema for the Tender Analytics module, which allows sales teams to query and analyze tender data with role-based access control and usage tracking.

  ## 1. New Tables

  ### `tenders`
  Stores tender data imported from CSV files with the following information:
  - `id` (uuid, primary key) - Unique identifier
  - `month` (integer) - Month of tender
  - `year` (integer) - Year of tender
  - `customer_name` (text) - Customer/hospital name
  - `tender_package_name` (text) - Name of tender package
  - `winning_company` (text) - Company that won the tender
  - `manufacturer` (text) - Product manufacturer/brand
  - `product_name` (text) - Name of product
  - `capacity` (numeric) - Product capacity/volume
  - `winning_quantity` (numeric) - Quantity won
  - `unit_price` (numeric) - Unit price
  - `winning_value` (numeric) - Total winning value
  - `winning_config` (text, nullable) - Configuration details
  - `sales_username` (text) - Associated sales person username
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `tender_search_quotas`
  Tracks daily search quotas for sales users:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, references auth.users) - User ID
  - `date` (date) - Date of quota
  - `searches_used` (integer) - Number of searches performed
  - `searches_limit` (integer) - Daily search limit (default 10)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp
  - Unique constraint on (user_id, date)

  ### `tender_search_logs`
  Logs all search activities for admin insights:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, references auth.users) - User performing search
  - `customer_filter` (text, nullable) - Customer name filter used
  - `manufacturer_filter` (text, nullable) - Manufacturer filter used
  - `product_filter` (text, nullable) - Product keyword filter used
  - `results_count` (integer) - Number of results returned
  - `created_at` (timestamptz) - Search timestamp

  ## 2. Indexes
  - Index on `tenders(sales_username)` for filtering by sales person
  - Index on `tenders(customer_name)` for customer search
  - Index on `tenders(manufacturer)` for manufacturer filtering
  - Index on `tenders(product_name)` for product search
  - Index on `tender_search_quotas(user_id, date)` for quota lookups
  - Index on `tender_search_logs(user_id)` for activity tracking

  ## 3. Security
  - Enable RLS on all tables
  - Super user (minh.nguyen) can see all tender data
  - Sales users can only see tenders where sales_username matches their username
  - Admin user can access quota and log management
  - All authenticated users can read their own quotas and logs
*/

-- Create tenders table
CREATE TABLE IF NOT EXISTS tenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL,
  year integer NOT NULL,
  customer_name text NOT NULL,
  tender_package_name text NOT NULL,
  winning_company text NOT NULL,
  manufacturer text NOT NULL,
  product_name text NOT NULL,
  capacity numeric NOT NULL,
  winning_quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  winning_value numeric NOT NULL,
  winning_config text,
  sales_username text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for tenders table
CREATE INDEX IF NOT EXISTS idx_tenders_sales_username ON tenders(sales_username);
CREATE INDEX IF NOT EXISTS idx_tenders_customer_name ON tenders(customer_name);
CREATE INDEX IF NOT EXISTS idx_tenders_manufacturer ON tenders(manufacturer);
CREATE INDEX IF NOT EXISTS idx_tenders_product_name ON tenders(product_name);
CREATE INDEX IF NOT EXISTS idx_tenders_year_month ON tenders(year, month);

-- Create tender_search_quotas table
CREATE TABLE IF NOT EXISTS tender_search_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  searches_used integer DEFAULT 0,
  searches_limit integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create index for quota lookups
CREATE INDEX IF NOT EXISTS idx_tender_search_quotas_user_date ON tender_search_quotas(user_id, date);

-- Create tender_search_logs table
CREATE TABLE IF NOT EXISTS tender_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_filter text,
  manufacturer_filter text,
  product_filter text,
  results_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create index for activity tracking
CREATE INDEX IF NOT EXISTS idx_tender_search_logs_user_id ON tender_search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tender_search_logs_created_at ON tender_search_logs(created_at DESC);

-- Enable RLS
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_search_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_search_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenders table
-- Super user can see all data
CREATE POLICY "Super user can view all tenders"
  ON tenders FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'minh.nguyen@company.com'
  );

-- Sales users can only see their own data
CREATE POLICY "Sales users can view own tenders"
  ON tenders FOR SELECT
  TO authenticated
  USING (
    sales_username = (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = auth.uid())
  );

-- Admin can view all tenders for analytics
CREATE POLICY "Admin can view all tenders"
  ON tenders FOR SELECT
  TO authenticated
  USING (
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for tender_search_quotas table
CREATE POLICY "Users can view own quota"
  ON tender_search_quotas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own quota"
  ON tender_search_quotas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quota"
  ON tender_search_quotas FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all quotas"
  ON tender_search_quotas FOR SELECT
  TO authenticated
  USING (
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admin can update all quotas"
  ON tender_search_quotas FOR UPDATE
  TO authenticated
  USING (
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for tender_search_logs table
CREATE POLICY "Users can view own search logs"
  ON tender_search_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own search logs"
  ON tender_search_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all search logs"
  ON tender_search_logs FOR SELECT
  TO authenticated
  USING (
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = auth.uid()) = 'admin'
  );