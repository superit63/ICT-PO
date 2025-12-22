/*
  # Create Core Application Tables

  ## Overview
  This migration creates the core database schema for the PharmaCRM application, including profiles, hospitals, doctors, visits, and activity tracking.

  ## 1. New Tables

  ### `profiles`
  User profiles with role-based access:
  - `id` (uuid, primary key, references auth.users) - User ID
  - `full_name` (text) - User's full name
  - `email` (text, unique) - User's email
  - `role` (text) - User role: 'admin' or 'sale'
  - `territory_code` (text, nullable) - Sales territory code
  - `phone` (text, nullable) - Phone number
  - `avatar_url` (text, nullable) - Avatar URL
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `hospitals`
  Hospital information:
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Hospital name
  - `address` (text, nullable) - Hospital address
  - `city` (text) - City
  - `region` (text, nullable) - Region
  - `created_at` (timestamptz) - Record creation timestamp

  ### `doctors`
  Doctor information and assignments:
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Doctor name
  - `birth_date` (date, nullable) - Birth date
  - `hospital_id` (uuid, references hospitals) - Hospital assignment
  - `department` (text) - Department
  - `doctor_role` (text) - Role within hospital
  - `phone` (text, nullable) - Phone number
  - `email` (text, nullable) - Email
  - `assigned_sales_id` (uuid, references profiles) - Assigned sales person
  - `status` (text) - Status: 'active', 'potential', 'churned'
  - `last_visit_at` (timestamptz, nullable) - Last visit timestamp
  - `notes` (text, nullable) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `visits`
  Visit tracking:
  - `id` (uuid, primary key) - Unique identifier
  - `doctor_id` (uuid, references doctors) - Doctor visited
  - `sales_id` (uuid, references profiles) - Sales person
  - `visit_date` (date) - Visit date
  - `outcome` (text) - Outcome: 'positive', 'neutral', 'negative', 'follow_up_needed'
  - `notes` (text, nullable) - Visit notes
  - `products_discussed` (jsonb, nullable) - Products discussed
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `visit_logs`
  Visit log processing:
  - `id` (uuid, primary key) - Unique identifier
  - `sales_id` (uuid, references profiles) - Sales person
  - `raw_input` (text) - Raw input text
  - `input_type` (text) - Type: 'text' or 'voice'
  - `parsed_data` (jsonb, nullable) - Parsed data
  - `status` (text) - Status: 'pending', 'confirmed', 'rejected'
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `activity_feeds`
  Activity tracking:
  - `id` (uuid, primary key) - Unique identifier
  - `doctor_id` (uuid, references doctors) - Related doctor
  - `sales_id` (uuid, references profiles) - Sales person
  - `activity_type` (text) - Type: 'visit', 'call', 'email', 'note'
  - `content` (text, nullable) - Activity content
  - `is_positive` (boolean) - Positive outcome flag
  - `created_at` (timestamptz) - Activity timestamp

  ### `products`
  Product catalog:
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Product name
  - `description` (text, nullable) - Product description
  - `manufacturer` (text, nullable) - Manufacturer
  - `created_at` (timestamptz) - Record creation timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Admin users can access all data
  - Sales users can only access their assigned data
  - Proper policies for each operation (SELECT, INSERT, UPDATE, DELETE)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'sale')),
  territory_code text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  city text NOT NULL,
  region text,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manufacturer text,
  created_at timestamptz DEFAULT now()
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  birth_date date,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  department text NOT NULL,
  doctor_role text NOT NULL,
  phone text,
  email text,
  assigned_sales_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('active', 'potential', 'churned')) DEFAULT 'active',
  last_visit_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  sales_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('positive', 'neutral', 'negative', 'follow_up_needed')),
  notes text,
  products_discussed jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create visit_logs table
CREATE TABLE IF NOT EXISTS visit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  raw_input text NOT NULL,
  input_type text NOT NULL CHECK (input_type IN ('text', 'voice')),
  parsed_data jsonb,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_feeds table
CREATE TABLE IF NOT EXISTS activity_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  sales_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('visit', 'call', 'email', 'note')),
  content text,
  is_positive boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doctors_assigned_sales_id ON doctors(assigned_sales_id);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital_id ON doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_sales_id ON visits(sales_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feeds_doctor_id ON activity_feeds(doctor_id);
CREATE INDEX IF NOT EXISTS idx_activity_feeds_sales_id ON activity_feeds(sales_id);
CREATE INDEX IF NOT EXISTS idx_activity_feeds_created_at ON activity_feeds(created_at DESC);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for hospitals
CREATE POLICY "Authenticated users can view hospitals"
  ON hospitals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage hospitals"
  ON hospitals FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for products
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage products"
  ON products FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for doctors
CREATE POLICY "Sales can view assigned doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (
    assigned_sales_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Sales can insert doctors"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (assigned_sales_id = auth.uid());

CREATE POLICY "Sales can update assigned doctors"
  ON doctors FOR UPDATE
  TO authenticated
  USING (
    assigned_sales_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    assigned_sales_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admin can delete doctors"
  ON doctors FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for visits
CREATE POLICY "Sales can view own visits"
  ON visits FOR SELECT
  TO authenticated
  USING (
    sales_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Sales can insert own visits"
  ON visits FOR INSERT
  TO authenticated
  WITH CHECK (sales_id = auth.uid());

CREATE POLICY "Sales can update own visits"
  ON visits FOR UPDATE
  TO authenticated
  USING (
    sales_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    sales_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admin can delete visits"
  ON visits FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for visit_logs
CREATE POLICY "Sales can view own visit logs"
  ON visit_logs FOR SELECT
  TO authenticated
  USING (
    sales_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Sales can insert own visit logs"
  ON visit_logs FOR INSERT
  TO authenticated
  WITH CHECK (sales_id = auth.uid());

CREATE POLICY "Sales can update own visit logs"
  ON visit_logs FOR UPDATE
  TO authenticated
  USING (
    sales_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    sales_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for activity_feeds
CREATE POLICY "Sales can view own activity feeds"
  ON activity_feeds FOR SELECT
  TO authenticated
  USING (
    sales_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Sales can insert own activity feeds"
  ON activity_feeds FOR INSERT
  TO authenticated
  WITH CHECK (sales_id = auth.uid());

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'sale')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
