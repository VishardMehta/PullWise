-- User Profiles Schema
-- 
-- 1. New Tables
--    - user_profiles: Stores complete GitHub profile information
--      - id (uuid, primary key) - References auth.users
--      - github_id (bigint, unique) - GitHub user ID
--      - github_username (text) - GitHub username/login
--      - name (text) - Full name
--      - email (text) - Email address
--      - avatar_url (text) - Profile picture URL
--      - bio (text) - User bio/description
--      - company (text) - Company name
--      - location (text) - Location
--      - blog (text) - Website/blog URL
--      - twitter_username (text) - Twitter handle
--      - public_repos (integer) - Number of public repositories
--      - public_gists (integer) - Number of public gists
--      - followers (integer) - Number of followers
--      - following (integer) - Number of following
--      - github_created_at (timestamptz) - When GitHub account was created
--      - github_updated_at (timestamptz) - When GitHub profile was last updated
--      - raw_user_meta_data (jsonb) - Complete GitHub profile data
--      - created_at (timestamptz) - Record creation timestamp
--      - updated_at (timestamptz) - Record update timestamp
--
-- 2. Security
--    - Enable RLS on user_profiles table
--    - Users can read their own profile
--    - Users can update their own profile
--    - Authenticated users can read other profiles (public data)
--
-- 3. Indexes
--    - Index on github_id for fast lookups
--    - Index on github_username for searches

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_id bigint UNIQUE,
  github_username text,
  name text,
  email text,
  avatar_url text,
  bio text,
  company text,
  location text,
  blog text,
  twitter_username text,
  public_repos integer DEFAULT 0,
  public_gists integer DEFAULT 0,
  followers integer DEFAULT 0,
  following integer DEFAULT 0,
  github_created_at timestamptz,
  github_updated_at timestamptz,
  raw_user_meta_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can read public profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_user_profiles_github_id ON user_profiles(github_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_github_username ON user_profiles(github_username);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();