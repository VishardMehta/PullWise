/*
  # PullWise Database Schema

  ## Overview
  Creates the complete database schema for PullWise, an AI-powered code review platform.
  
  ## New Tables
  
  ### `repositories`
  - `id` (uuid, primary key)
  - `name` (text) - Repository name
  - `url` (text) - Repository URL
  - `provider` (text) - Git provider (github, gitlab, etc.)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `pull_requests`
  - `id` (uuid, primary key)
  - `repository_id` (uuid, foreign key)
  - `pr_number` (integer) - Pull request number
  - `title` (text) - PR title
  - `description` (text) - PR description
  - `author` (text) - PR author
  - `status` (text) - open, closed, merged
  - `branch_source` (text) - Source branch
  - `branch_target` (text) - Target branch
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `code_reviews`
  - `id` (uuid, primary key)
  - `pull_request_id` (uuid, foreign key)
  - `analysis_type` (text) - static, ml, combined
  - `severity` (text) - info, warning, error, critical
  - `status` (text) - pending, completed, failed
  - `summary` (text) - Review summary
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `issues`
  - `id` (uuid, primary key)
  - `review_id` (uuid, foreign key)
  - `file_path` (text) - File path
  - `line_number` (integer) - Line number
  - `issue_type` (text) - bug, security, performance, style, etc.
  - `severity` (text) - info, warning, error, critical
  - `description` (text) - Issue description
  - `suggestion` (text) - Fix suggestion
  - `code_snippet` (text) - Code snippet
  - `created_at` (timestamptz)
  
  ### `fix_applications`
  - `id` (uuid, primary key)
  - `issue_id` (uuid, foreign key)
  - `applied_by` (text) - User who applied the fix
  - `status` (text) - applied, reverted, pending
  - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Public read access for demo purposes
  - Authenticated users can create and update records
  
  ## Notes
  - All timestamps use timestamptz for timezone awareness
  - UUIDs for primary keys for better distribution
  - Foreign key constraints ensure data integrity
*/

-- Create repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  provider text NOT NULL DEFAULT 'github',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pull_requests table
CREATE TABLE IF NOT EXISTS pull_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  pr_number integer NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  author text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  branch_source text NOT NULL,
  branch_target text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create code_reviews table
CREATE TABLE IF NOT EXISTS code_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pull_request_id uuid NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
  analysis_type text NOT NULL DEFAULT 'combined',
  severity text NOT NULL DEFAULT 'info',
  status text NOT NULL DEFAULT 'pending',
  summary text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES code_reviews(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  line_number integer NOT NULL,
  issue_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  description text NOT NULL,
  suggestion text DEFAULT '',
  code_snippet text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create fix_applications table
CREATE TABLE IF NOT EXISTS fix_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  applied_by text NOT NULL,
  status text NOT NULL DEFAULT 'applied',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE fix_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public can view repositories"
  ON repositories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view pull requests"
  ON pull_requests FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view code reviews"
  ON code_reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view issues"
  ON issues FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view fix applications"
  ON fix_applications FOR SELECT
  TO public
  USING (true);

-- Create policies for authenticated users to insert/update
CREATE POLICY "Authenticated users can insert repositories"
  ON repositories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update repositories"
  ON repositories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert pull requests"
  ON pull_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pull requests"
  ON pull_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert code reviews"
  ON code_reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update code reviews"
  ON code_reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert issues"
  ON issues FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert fix applications"
  ON fix_applications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pull_requests_repository_id ON pull_requests(repository_id);
CREATE INDEX IF NOT EXISTS idx_code_reviews_pull_request_id ON code_reviews(pull_request_id);
CREATE INDEX IF NOT EXISTS idx_issues_review_id ON issues(review_id);
CREATE INDEX IF NOT EXISTS idx_fix_applications_issue_id ON fix_applications(issue_id);
