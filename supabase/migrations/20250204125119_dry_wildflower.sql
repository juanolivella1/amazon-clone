/*
  # Fix admin access and add features column

  1. Changes
    - Update admin policy to use email domain instead of role
    - Add features column to products table
    - Add default values for rating and reviews_count
  
  2. Security
    - Fix admin access policy
    - Maintain existing RLS policies
*/

-- Add features column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'features'
  ) THEN
    ALTER TABLE products ADD COLUMN features JSONB;
  END IF;
END $$;

-- Set default values for rating and reviews_count
ALTER TABLE products ALTER COLUMN rating SET DEFAULT 0;
ALTER TABLE products ALTER COLUMN reviews_count SET DEFAULT 0;

-- Drop existing admin policy
DROP POLICY IF EXISTS "Only admins can modify products" ON products;

-- Create new admin policy using email domain
CREATE POLICY "Only admins can modify products"
  ON products
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@admin.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@admin.com');