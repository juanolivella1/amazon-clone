/*
  # Add category column to products table

  1. Changes
    - Add category column to products table
    - Update existing products with categories
*/

-- Add category column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category'
  ) THEN
    ALTER TABLE products ADD COLUMN category text;
  END IF;
END $$;

-- Update existing products with categories
UPDATE products 
SET category = 
  CASE name
    WHEN 'Echo Dot (5th Gen)' THEN 'electronics'
    WHEN 'Samsung Galaxy Tab S9' THEN 'electronics'
    WHEN 'Apple AirPods Pro (2nd Gen)' THEN 'electronics'
    WHEN 'Instant Pot Duo Plus 9-in-1' THEN 'home'
    WHEN 'COSORI Air Fryer Pro LE' THEN 'home'
    ELSE 'other'
  END
WHERE category IS NULL;