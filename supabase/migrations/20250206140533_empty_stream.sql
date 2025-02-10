/*
  # Add admin and chat functionality

  1. New Tables
    - `admin_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `store_name` (text)
      - `description` (text)
      - `created_at` (timestamp)

    - `chats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `admin_id` (uuid, references admin_profiles)
      - `created_at` (timestamp)

    - `messages`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, references chats)
      - `sender_id` (uuid, references auth.users)
      - `content` (text)
      - `created_at` (timestamp)

  2. Changes
    - Add `admin_id` to products table
    - Add indexes for better query performance

  3. Security
    - Enable RLS on all new tables
    - Add policies for admin and user access
*/

-- Create admin_profiles table
CREATE TABLE admin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  store_name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create chats table
CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  admin_id uuid REFERENCES admin_profiles NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats NOT NULL,
  sender_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add admin_id to products
ALTER TABLE products ADD COLUMN admin_id uuid REFERENCES admin_profiles;

-- Create indexes
CREATE INDEX idx_admin_profiles_user_id ON admin_profiles(user_id);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_admin_id ON chats(admin_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_products_admin_id ON products(admin_id);

-- Enable RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for admin_profiles
CREATE POLICY "Public can view admin profiles"
  ON admin_profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create admin profile if email ends with @admin.com"
  ON admin_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' LIKE '%@admin.com'
  );

CREATE POLICY "Admins can update their own profile"
  ON admin_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for chats
CREATE POLICY "Users can view their own chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.user_id = auth.uid()
      AND admin_profiles.id = chats.admin_id
    )
  );

CREATE POLICY "Users can create chats"
  ON chats
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policies for messages
CREATE POLICY "Chat participants can view messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (
        chats.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM admin_profiles
          WHERE admin_profiles.user_id = auth.uid()
          AND admin_profiles.id = chats.admin_id
        )
      )
    )
  );

CREATE POLICY "Chat participants can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (
        chats.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM admin_profiles
          WHERE admin_profiles.user_id = auth.uid()
          AND admin_profiles.id = chats.admin_id
        )
      )
    )
  );

-- Update products policy
DROP POLICY IF EXISTS "Only admins can modify products" ON products;

CREATE POLICY "Admins can modify their own products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.user_id = auth.uid()
      AND admin_profiles.id = products.admin_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.user_id = auth.uid()
      AND admin_profiles.id = products.admin_id
    )
  );