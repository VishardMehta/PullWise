import { supabase } from '@/integrations/supabase/client';

export interface SandboxRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  created_at: string;
}

export interface SandboxPR {
  number: number;
  title: string;
  html_url: string;
  state: string;
  head: { ref: string };
  base: { ref: string };
}

export class SandboxService {
  private static instance: SandboxService;

  private constructor() {}

  public static getInstance(): SandboxService {
    if (!SandboxService.instance) {
      SandboxService.instance = new SandboxService();
    }
    return SandboxService.instance;
  }

  /**
   * Get GitHub access token from current session
   */
  private async getGitHubToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.provider_token;
    
    if (!token) {
      throw new Error('No GitHub access token found. Please re-authenticate.');
    }
    
    return token;
  }

  /**
   * Create a new sandbox repository
   */
  public async createSandboxRepo(): Promise<SandboxRepo> {
    const token = await this.getGitHubToken();
    const timestamp = Date.now();
    const repoName = `pullwise-sandbox-${timestamp}`;

    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: '🧪 PullWise Testing Sandbox - Safe to delete anytime',
        private: false,
        auto_init: true,
        gitignore_template: 'Node',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create repository: ${error.message}`);
    }

    const repo = await response.json();
    
    // Wait a bit for GitHub to initialize the repo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add sample files
    await this.createSampleFiles(repo.full_name, token);
    
    // Create sample PRs
    await this.createSamplePRs(repo.full_name, token);

    return repo;
  }

  /**
   * Create sample code files in the repository
   */
  private async createSampleFiles(repoFullName: string, token: string): Promise<void> {
    const files = [
      {
        path: 'README.md',
        content: this.getReadmeContent(),
        message: 'docs: Update README with sandbox information',
      },
      {
        path: 'src/auth/login.ts',
        content: this.getGoodLoginCode(),
        message: 'feat: Add authentication module',
      },
      {
        path: 'src/utils/validation.ts',
        content: this.getValidationCode(),
        message: 'feat: Add validation utilities',
      },
      {
        path: 'package.json',
        content: this.getPackageJson(),
        message: 'chore: Initialize package.json',
      },
    ];

    for (const file of files) {
      try {
        await fetch(`https://api.github.com/repos/${repoFullName}/contents/${file.path}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: file.message,
            content: btoa(unescape(encodeURIComponent(file.content))),
          }),
        });
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to create ${file.path}:`, error);
      }
    }
  }

  /**
   * Create sample PRs with different quality levels
   */
  private async createSamplePRs(repoFullName: string, token: string): Promise<void> {
    // Get the default branch SHA
    const mainBranch = await this.getDefaultBranch(repoFullName, token);
    
    // Create 3 PRs: Good, Moderate, Bad
    const prs = [
      {
        branch: 'feature/good-example',
        title: '✅ Good PR Example - Clean Authentication',
        body: this.getGoodPRDescription(),
        files: [
          {
            path: 'src/auth/secure-login.ts',
            content: this.getSecureLoginCode(),
            message: 'feat: Add secure login with proper validation',
          },
        ],
      },
      {
        branch: 'feature/moderate-example',
        title: '⚠️ Moderate PR - Auth with Some Issues',
        body: this.getModeratePRDescription(),
        files: [
          {
            path: 'src/auth/basic-login.ts',
            content: this.getModerateLoginCode(),
            message: 'add login feature',
          },
        ],
      },
      {
        branch: 'feature/bad-example',
        title: '❌ Bad PR Example - Security Issues',
        body: this.getBadPRDescription(),
        files: [
          {
            path: 'src/auth/insecure-login.ts',
            content: this.getBadLoginCode(),
            message: 'login stuff',
          },
        ],
      },
    ];

    for (const pr of prs) {
      try {
        // Create branch
        await this.createBranch(repoFullName, pr.branch, mainBranch.sha, token);
        
        // Add files to branch
        for (const file of pr.files) {
          await this.createFileInBranch(repoFullName, pr.branch, file, token);
        }
        
        // Create PR
        await this.createPR(repoFullName, pr.title, pr.body, pr.branch, mainBranch.name, token);
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to create PR ${pr.title}:`, error);
      }
    }
  }

  /**
   * Get default branch information
   */
  private async getDefaultBranch(repoFullName: string, token: string): Promise<{ name: string; sha: string }> {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    const repo = await response.json();
    const defaultBranch = repo.default_branch || 'main';

    const branchResponse = await fetch(`https://api.github.com/repos/${repoFullName}/branches/${defaultBranch}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    const branch = await branchResponse.json();
    return { name: defaultBranch, sha: branch.commit.sha };
  }

  /**
   * Create a new branch
   */
  private async createBranch(repoFullName: string, branchName: string, sha: string, token: string): Promise<void> {
    await fetch(`https://api.github.com/repos/${repoFullName}/git/refs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: sha,
      }),
    });
  }

  /**
   * Create a file in a specific branch
   */
  private async createFileInBranch(
    repoFullName: string,
    branch: string,
    file: { path: string; content: string; message: string },
    token: string
  ): Promise<void> {
    await fetch(`https://api.github.com/repos/${repoFullName}/contents/${file.path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: file.message,
        content: btoa(unescape(encodeURIComponent(file.content))),
        branch: branch,
      }),
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Create a pull request
   */
  private async createPR(
    repoFullName: string,
    title: string,
    body: string,
    head: string,
    base: string,
    token: string
  ): Promise<SandboxPR> {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        head,
        base,
      }),
    });

    return await response.json();
  }

  /**
   * Delete sandbox repository
   */
  public async deleteSandboxRepo(repoFullName: string): Promise<void> {
    const token = await this.getGitHubToken();

    const response = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Failed to delete repository');
    }
  }

  /**
   * List user's sandbox repositories
   */
  public async listSandboxRepos(): Promise<SandboxRepo[]> {
    const token = await this.getGitHubToken();

    const response = await fetch('https://api.github.com/user/repos?sort=created&direction=desc&per_page=100', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    const repos = await response.json();
    return repos.filter((repo: any) => repo.name.startsWith('pullwise-sandbox-'));
  }

  // Sample code templates below...

  private getReadmeContent(): string {
    return `# 🧪 PullWise Testing Sandbox

This is a temporary testing repository created by [PullWise](https://pullwise.vercel.app).

## Purpose
- Learn how PR analysis works
- Experiment with different code patterns
- See how code quality affects analysis scores
- Practice without affecting real repositories

## Sample PRs

This repository includes 3 sample Pull Requests:

1. **✅ Good PR Example** - Clean, well-tested code (Expected score: 85-95%)
2. **⚠️ Moderate PR** - Some issues present (Expected score: 60-70%)
3. **❌ Bad PR Example** - Multiple issues (Expected score: 30-40%)

## How to Use

1. Analyze each PR using PullWise
2. Compare the analysis results
3. Learn what makes a high-quality PR
4. Create your own test PRs!

## Cleanup

Feel free to delete this repository anytime - it's just for testing!

---

Generated by PullWise • ${new Date().toLocaleDateString()}
`;
  }

  private getPackageJson(): string {
    return JSON.stringify({
      name: 'pullwise-sandbox',
      version: '1.0.0',
      description: 'PullWise testing sandbox',
      main: 'src/index.ts',
      scripts: {
        test: 'echo "Run tests here"',
      },
      keywords: ['pullwise', 'sandbox', 'testing'],
      author: 'PullWise',
      license: 'MIT',
    }, null, 2);
  }

  private getGoodLoginCode(): string {
    return `// Good example: Clean, type-safe, well-structured
import { hash, compare } from 'bcrypt';

interface User {
  id: string;
  email: string;
  passwordHash: string;
}

interface LoginResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export class AuthService {
  private readonly SALT_ROUNDS = 10;
  
  /**
   * Authenticate user with email and password
   * @throws {Error} If validation fails
   */
  async login(email: string, password: string): Promise<LoginResult> {
    // Input validation
    if (!this.validateEmail(email)) {
      return { success: false, error: 'Invalid email format' };
    }
    
    if (!this.validatePassword(password)) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }
    
    try {
      // Fetch user securely
      const user = await this.findUserByEmail(email);
      
      if (!user) {
        // Generic error to prevent user enumeration
        return { success: false, error: 'Invalid credentials' };
      }
      
      // Secure password comparison
      const isValid = await compare(password, user.passwordHash);
      
      if (!isValid) {
        return { success: false, error: 'Invalid credentials' };
      }
      
      // Generate secure session token
      const token = await this.generateSecureToken(user.id);
      
      return { success: true, user, token };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }
  
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
  }
  
  private validatePassword(password: string): boolean {
    return password.length >= 8;
  }
  
  private async findUserByEmail(email: string): Promise<User | null> {
    // Use parameterized queries to prevent SQL injection
    return null; // Implement database lookup
  }
  
  private async generateSecureToken(userId: string): Promise<string> {
    // Implement JWT or session token generation
    return 'secure_token_here';
  }
}
`;
  }

  private getValidationCode(): string {
    return `// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '');
}
`;
  }

  private getSecureLoginCode(): string {
    return `// ✅ GOOD: Secure authentication with best practices
import { hash, compare } from 'bcrypt';
import { createHmac } from 'crypto';

export class SecureAuthService {
  private readonly SECRET_KEY = process.env.SECRET_KEY || 'change-me';
  private readonly TOKEN_EXPIRY = 3600; // 1 hour
  
  async authenticateUser(email: string, password: string) {
    // Comprehensive validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Secure database query (parameterized)
    const user = await this.db.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );
    
    if (!user) {
      // Don't reveal if user exists
      throw new Error('Invalid credentials');
    }
    
    // Use bcrypt for password comparison
    const isValid = await compare(password, user.password_hash);
    
    if (!isValid) {
      await this.logFailedAttempt(email);
      throw new Error('Invalid credentials');
    }
    
    // Generate secure token with HMAC
    const token = this.generateToken(user.id);
    
    // Store session with expiry
    await this.sessionStore.set(token, {
      userId: user.id,
      expiresAt: Date.now() + (this.TOKEN_EXPIRY * 1000)
    });
    
    return { token, userId: user.id };
  }
  
  private generateToken(userId: string): string {
    const hmac = createHmac('sha256', this.SECRET_KEY);
    hmac.update(\`\${userId}-\${Date.now()}-\${Math.random()}\`);
    return hmac.digest('hex');
  }
  
  private async logFailedAttempt(email: string): Promise<void> {
    console.warn(\`Failed login attempt for: \${email}\`);
    // Implement rate limiting here
  }
}
`;
  }

  private getModerateLoginCode(): string {
    return `// ⚠️ MODERATE: Some issues present
function loginUser(email, password) {
  // Missing validation
  if (!email || !password) {
    return null;
  }
  
  // Direct SQL query (SQL injection risk)
  const query = "SELECT * FROM users WHERE email='" + email + "'";
  const user = database.execute(query);
  
  // Password comparison without hashing
  if (user && user.password === password) {
    // Session management is basic
    const sessionId = Math.random().toString(36);
    localStorage.setItem('session', sessionId);
    return user;
  }
  
  return null;
}

// No error handling
// No input sanitization
// Hardcoded values
const MAX_ATTEMPTS = 5;
`;
  }

  private getBadLoginCode(): string {
    return `// ❌ BAD: Multiple security issues
function login(e, p) {
  // No validation at all
  // SQL injection vulnerability!
  var sql = "SELECT * FROM users WHERE email='" + e + "' AND password='" + p + "'";
  var result = db.run(sql);
  
  if (result) {
    // Storing sensitive data in localStorage!
    localStorage.setItem('user', JSON.stringify(result));
    localStorage.setItem('pass', p); // Storing password in plain text!
    
    // Setting global variable
    window.currentUser = result;
    
    return true;
  } else {
    // Revealing information in error
    alert('User ' + e + ' not found or wrong password');
    return false;
  }
}

// No error handling
// No type safety
// Mixing concerns
// Poor naming
`;
  }

  private getGoodPRDescription(): string {
    return `## Summary
Implements secure authentication with industry best practices.

## Changes
- ✅ Bcrypt password hashing
- ✅ HMAC token generation
- ✅ Parameterized SQL queries
- ✅ Comprehensive input validation
- ✅ Rate limiting for failed attempts
- ✅ Proper error handling
- ✅ TypeScript types

## Security
- No SQL injection vulnerabilities
- Passwords never stored in plain text
- Secure session management
- Failed attempt logging

## Testing
- Unit tests included
- Edge cases covered
- Security audit passed

**Expected Analysis Score: 85-95%**
`;
  }

  private getModeratePRDescription(): string {
    return `## Summary
Basic login functionality

## Changes
- Added login function
- Basic validation

## Issues
- Some SQL injection risks
- Password hashing missing
- Error handling incomplete

**Expected Analysis Score: 60-70%**
`;
  }

  private getBadPRDescription(): string {
    return `login stuff

**Expected Analysis Score: 30-40%**
`;
  }
}
