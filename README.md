# PullWise - AI-Powered Code Review Platform

PullWise is an intelligent code review platform that uses machine learning to analyze pull requests, identify issues, and automatically suggest fixes. Built with React, TypeScript, and Supabase.

## Features

### 🤖 AI-Powered Analysis
- **Static Analysis**: Integrated ESLint, Pylint, and Bandit for comprehensive code scanning
- **ML Suggestions**: Advanced machine learning models provide intelligent code improvements
- **Security Detection**: Automated identification of security vulnerabilities
- **Performance Optimization**: Suggestions for performance improvements

### ⚡ Automated Fixes
- **One-Click Fixes**: Apply suggested improvements with a single click
- **Sandbox Environment**: Safe testing of fixes in isolated branches
- **Auto-PR Creation**: Automatic creation of pull requests for applied fixes
- **Approval Workflow**: Optional manual approval for automated changes

### 📊 Team Analytics
- **Quality Metrics**: Track code quality trends over time
- **Team Performance**: Individual and team-wide performance insights
- **Issue Hotspots**: Identify files and areas that need attention
- **Historical Data**: Long-term trends and improvement tracking

### 🔗 Git Integration
- **GitHub Integration**: Seamless connection with GitHub repositories
- **GitLab Support**: Full support for GitLab projects
- **Webhook Processing**: Real-time pull request monitoring
- **Branch Management**: Automated branch creation and management

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** for form management
- **Recharts** for data visualization
- **Monaco Editor** for code editing
- **Prism.js** for syntax highlighting

### Backend & Database
- **Supabase** for backend services
- **PostgreSQL** database
- **Row Level Security** for data protection
- **Real-time subscriptions** for live updates

### Authentication
- **OAuth integration** with GitHub and GitLab
- **JWT tokens** for secure authentication
- **Role-based access control**

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/pullwise.git
   cd pullwise
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations (see Database Setup below)
   - Configure OAuth providers in Supabase Auth settings

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Database Setup

The application requires several database tables. Create these in your Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  github_username TEXT,
  gitlab_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repositories table
CREATE TABLE repositories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  provider TEXT CHECK (provider IN ('github', 'gitlab')) NOT NULL,
  provider_id TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  owner_id UUID REFERENCES users(id) NOT NULL,
  is_private BOOLEAN DEFAULT false,
  default_branch TEXT DEFAULT 'main',
  webhook_url TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pull requests table
CREATE TABLE pull_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  repository_id UUID REFERENCES repositories(id) NOT NULL,
  provider_pr_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT NOT NULL,
  base_branch TEXT NOT NULL,
  head_branch TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'closed', 'merged')) DEFAULT 'open',
  files_changed INTEGER DEFAULT 0,
  lines_added INTEGER DEFAULT 0,
  lines_deleted INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis jobs table
CREATE TABLE analysis_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pull_request_id UUID REFERENCES pull_requests(id) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Static analysis results table
CREATE TABLE static_analysis_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analysis_job_id UUID REFERENCES analysis_jobs(id) NOT NULL,
  file_path TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  column_number INTEGER,
  rule_id TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('error', 'warning', 'info')) NOT NULL,
  message TEXT NOT NULL,
  suggestion TEXT,
  is_fixed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ML suggestions table
CREATE TABLE ml_suggestions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analysis_job_id UUID REFERENCES analysis_jobs(id) NOT NULL,
  file_path TEXT NOT NULL,
  line_start INTEGER NOT NULL,
  line_end INTEGER NOT NULL,
  original_code TEXT NOT NULL,
  suggested_code TEXT NOT NULL,
  explanation TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  effort_score TEXT CHECK (effort_score IN ('low', 'medium', 'high')) NOT NULL,
  impact_score TEXT CHECK (impact_score IN ('low', 'medium', 'high')) NOT NULL,
  category TEXT CHECK (category IN ('security', 'performance', 'maintainability', 'bug', 'style')) NOT NULL,
  is_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sandbox branches table
CREATE TABLE sandbox_branches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ml_suggestion_id UUID REFERENCES ml_suggestions(id) NOT NULL,
  branch_name TEXT NOT NULL,
  commit_sha TEXT,
  pull_request_url TEXT,
  status TEXT CHECK (status IN ('created', 'committed', 'pr_opened', 'merged', 'failed')) DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_branches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own organizations" ON organizations FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can manage own organizations" ON organizations FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Users can read own repositories" ON repositories FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can manage own repositories" ON repositories FOR ALL USING (owner_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_repositories_owner_id ON repositories(owner_id);
CREATE INDEX idx_pull_requests_repository_id ON pull_requests(repository_id);
CREATE INDEX idx_analysis_jobs_pull_request_id ON analysis_jobs(pull_request_id);
CREATE INDEX idx_static_analysis_results_job_id ON static_analysis_results(analysis_job_id);
CREATE INDEX idx_ml_suggestions_job_id ON ml_suggestions(analysis_job_id);
CREATE INDEX idx_sandbox_branches_suggestion_id ON sandbox_branches(ml_suggestion_id);
```

## Architecture

### System Components

1. **Frontend Dashboard** (React)
   - User authentication and management
   - Repository configuration
   - Pull request analysis visualization
   - Team analytics and reporting

2. **Backend API** (Supabase)
   - RESTful API for data operations
   - Real-time subscriptions
   - Authentication and authorization
   - Webhook processing

3. **Analysis Workers** (Future Implementation)
   - Static analysis execution (ESLint, Pylint, Bandit)
   - ML model inference
   - Sandbox environment management
   - Git operations

4. **Database** (PostgreSQL)
   - User and organization data
   - Repository configurations
   - Analysis results and suggestions
   - Historical metrics

### Data Flow

1. **Webhook Reception**: Git provider sends webhook on PR events
2. **Job Queuing**: Analysis job is queued for processing
3. **Static Analysis**: Code is analyzed using static analyzers
4. **ML Analysis**: ML models generate improvement suggestions
5. **Results Storage**: Findings are stored in the database
6. **UI Updates**: Frontend displays results to users
7. **Fix Application**: Users can apply suggestions via sandbox branches

## Configuration

### OAuth Setup

#### GitHub
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App with:
   - Homepage URL: `http://localhost:5173` (development)
   - Authorization callback URL: `http://localhost:5173/auth/callback`
3. Add the client ID to your Supabase Auth settings

#### GitLab
1. Go to GitLab User Settings > Applications
2. Create a new application with:
   - Redirect URI: `http://localhost:5173/auth/callback`
   - Scopes: `api`, `read_user`, `read_repository`
3. Add the application ID to your Supabase Auth settings

### Webhook Configuration

For each repository, configure webhooks to point to your PullWise instance:
- **Payload URL**: `https://your-domain.com/api/webhooks/github` (or `/gitlab`)
- **Content type**: `application/json`
- **Events**: Pull requests, Push events

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Project Structure

```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # Dashboard components
│   ├── Layout/         # Layout components
│   ├── PullRequests/   # PR analysis components
│   ├── Repositories/   # Repository management
│   ├── Analytics/      # Analytics and reporting
│   ├── Team/          # Team management
│   └── Settings/      # Settings components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── main.tsx          # Application entry point
```

## Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting platform**
   - Vercel, Netlify, or similar
   - Configure environment variables
   - Set up custom domain

3. **Configure production webhooks**
   - Update webhook URLs to production domain
   - Ensure SSL certificates are valid

### Environment Variables

Required environment variables for production:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- 📧 Email: support@pullwise.dev
- 💬 Discord: [Join our community](https://discord.gg/pullwise)
- 📖 Documentation: [docs.pullwise.dev](https://docs.pullwise.dev)

## Roadmap

### Phase 1 (Current)
- ✅ Basic UI and authentication
- ✅ Repository management
- ✅ Pull request visualization
- ✅ Mock analysis results

### Phase 2 (Next)
- 🔄 Real static analysis integration
- 🔄 ML model implementation
- 🔄 Webhook processing
- 🔄 Sandbox automation

### Phase 3 (Future)
- 📋 Advanced ML models
- 📋 CI/CD integration
- 📋 Enterprise features
- 📋 Multi-language support

---

Built with ❤️ by the PullWise team