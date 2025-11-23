import { supabase } from '@/integrations/supabase/client';

interface ChangeGroup {
  files: PRFileChange[];
  type: string;
  description: string;
}

interface ChangeSummary {
  issues: CodeIssue[];
  groups: ChangeGroup[];
  impactScore: number;
}

export interface PRCommit {
  sha: string;
  message: string;
  additions: number;
  deletions: number;
}

export interface PRFileChange {
  path: string;
  content: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  beforeName?: string;
  beforeContent?: string;
  afterContent?: string;
}

export interface CodeAnalysisRequest {
  pullRequestId: string;
  repositoryUrl: string;
  branch: string;
  title: string;
  description: string;
  baseBranch: string;
  files: PRFileChange[];
  commits: {
    sha: string;
    message: string;
    additions: number;
    deletions: number;
  }[];
}

export interface CodeIssue {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  line: number;
  file: string;
  suggestion?: string;
  severity: 'high' | 'medium' | 'low';
}

export interface CodeAnalysisResult {
  issues: CodeIssue[];
  metrics: {
    complexity: number;
    coverage: number;
    duplications: number;
    issues: {
      errors: number;
      warnings: number;
      suggestions: number;
    };
  };
}

export class CodeAnalysisService {
  private static instance: CodeAnalysisService;
  private analysisCache: Map<string, CodeAnalysisResult>;

  private constructor() {
    this.analysisCache = new Map();
  }

  private analyzeCommitMessages(commits: PRCommit[]): string[] {
    const types = new Set<string>();
    
    commits.forEach(commit => {
      const message = commit.message.toLowerCase();
      
      // Extract change type from conventional commits
      const conventionalMatch = message.match(/^(feat|fix|refactor|docs|style|test|chore|perf)(\(.*?\))?:/);
      if (conventionalMatch) {
        types.add(conventionalMatch[1]);
      } else {
        // Try to infer type from message content
        if (message.includes('fix') || message.includes('bug')) types.add('fix');
        if (message.includes('add') || message.includes('new')) types.add('feat');
        if (message.includes('refactor')) types.add('refactor');
        if (message.includes('test')) types.add('test');
        if (message.includes('docs') || message.includes('documentation')) types.add('docs');
      }
    });

    return Array.from(types);
  }

  private analyzeDiff(lines: string[], filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    let inFunction = false;
    let functionStartLine = 0;
    let bracketCount = 0;

    lines.forEach((line, index) => {
      if (!line.startsWith('+')) return;
      const codeLine = line.substring(1);

      // Function analysis
      if (codeLine.includes('function') || codeLine.includes('=>')) {
        inFunction = true;
        functionStartLine = index;
      }

      if (inFunction) {
        bracketCount += (codeLine.match(/{/g) || []).length;
        bracketCount -= (codeLine.match(/}/g) || []).length;

        if (bracketCount === 0) {
          inFunction = false;
          const functionLength = index - functionStartLine;
          if (functionLength > 30) {
            issues.push({
              type: 'suggestion',
              message: 'Large function added',
              line: functionStartLine + 1,
              file: filePath,
              suggestion: 'Consider breaking down this function into smaller, more focused functions',
              severity: 'medium'
            });
          }
        }
      }

      // API changes
      if (codeLine.includes('api') || codeLine.includes('fetch') || codeLine.includes('axios')) {
        issues.push({
          type: 'suggestion',
          message: 'New API integration detected',
          line: index + 1,
          file: filePath,
          suggestion: 'Ensure error handling and rate limiting are implemented',
          severity: 'medium'
        });
      }

      // State management changes
      if (codeLine.includes('useState') || codeLine.includes('useReducer') || codeLine.includes('store')) {
        issues.push({
          type: 'suggestion',
          message: 'State management changes detected',
          line: index + 1,
          file: filePath,
          suggestion: 'Verify state updates and side effects are properly handled',
          severity: 'medium'
        });
      }
    });

    return issues;
  }

  private hasBreakingChanges(lines: string[]): boolean {
    const deletedLines = lines.filter(line => line.startsWith('-'));
    const addedLines = lines.filter(line => line.startsWith('+'));

    // Check for interface changes
    const deletedInterfaces = deletedLines.filter(line => 
      line.includes('interface') || 
      line.includes('type') || 
      line.includes('class')
    ).length;

    const modifiedProps = deletedLines.filter(line =>
      line.includes('props') ||
      line.includes('required') ||
      line.includes('optional')
    ).length;

    return deletedInterfaces > 0 || modifiedProps > 0;
  }

  private checkSecurityIssues(lines: string[], filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const securityPatterns = {
      // Critical: Secrets & Credentials
      'Hardcoded Secrets': /(['"])(password|secret|key|token|api[_-]?key|private[_-]?key|access[_-]?key|auth[_-]?token)\1\s*[:=]\s*['"][^'"]+['"]/i,
      'Exposed Credentials': /(?:password|pwd|passwd)\s*[:=]\s*['"][^'"]{0,50}['"]/i,
      'AWS Key Exposure': /AKIA[0-9A-Z]{16}/,
      'Private Key Hardcoded': /-----BEGIN (?:RSA |DSA )?PRIVATE KEY-----/,
      
      // Critical: Injection Attacks
      'SQL Injection': /(?:execute|query|sql)\s*\(\s*[`'"].*?\$\{.*?\}|\.concat\(|\.append\(/i,
      'Command Injection': /(?:exec|spawn|fork|system)\s*\(\s*['"`].*?\$\{|\.concat\(/i,
      'NoSQL Injection': /(?:find|findOne|update|delete|remove)\s*\(\s*\{.*?\$\{/i,
      
      // High: XSS & DOM Vulnerabilities
      'XSS Vulnerability': /dangerouslySetInnerHTML|innerHTML\s*=|document\.write|eval\(|Function\(/i,
      'Unsafe String Interpolation': /innerHTML\s*\+=|insertAdjacentHTML/i,
      'Unsafe DOM Methods': /\.html\(|\.append\(|jQuery.*html/i,
      
      // High: Insecure Communication
      'Insecure Protocol': /http:\/\/(?!localhost)/i,
      'Insecure Cookie': /secure\s*[:=]\s*false|httpOnly\s*[:=]\s*false/i,
      
      // High: Cryptography Issues
      'Weak Crypto': /md5|sha1|DES|RC4|crypt\(/i,
      'Hardcoded Cipher Key': /cipher\.update\(.*['"][a-zA-Z0-9]{8,}/i,
      
      // Medium: Authentication & Authorization
      'Weak Password Check': /password.*length\s*[<]{1,2}\s*[68]/i,
      'JWT without Verification': /jwt\.decode\s*\([^,]*\)(?!\s*,\s*verify)/i,
      'Missing CSRF Token': /form.*method\s*=\s*['"](post|put|delete)/i,
      
      // Medium: Race Conditions & Concurrency
      'Potential Race Condition': /setTimeout|setInterval.*(?:fetch|axios|supabase)/i,
      'TOCTOU Vulnerability': /(?:fs\.exists|fs\.stat).*fs\.(?:write|read)/i,
      
      // Medium: Logic Issues
      'Always True Condition': /if\s*\(\s*true\s*\)|if\s*\(\s*1\s*\)/i,
      'Dead Code': /else\s*{\s*(?:\/\/|throw|return|unreachable)/i
    };

    lines.forEach((line, index) => {
      if (!line.startsWith('+')) return;
      const codeLine = line.substring(1);

      Object.entries(securityPatterns).forEach(([issue, pattern]) => {
        if (pattern.test(codeLine)) {
          issues.push({
            type: 'error',
            message: `Potential security issue: ${issue}`,
            line: index + 1,
            file: filePath,
            suggestion: this.getSecuritySuggestion(issue),
            severity: 'high'
          });
        }
      });
    });

    return issues;
  }

  private getSecuritySuggestion(issue: string): string {
    const suggestions: Record<string, string> = {
      'Hardcoded Secrets': 'Move sensitive data to environment variables, use dotenv, or integrate with a secrets management service',
      'Exposed Credentials': 'Never hardcode credentials. Use environment variables or a vault service (AWS Secrets Manager, HashiCorp Vault)',
      'AWS Key Exposure': 'This looks like an AWS access key. Immediately rotate it. Use IAM roles instead of keys',
      'Private Key Hardcoded': 'Critical: Private keys must never be in code. Use key management services',
      'SQL Injection': 'Use parameterized queries or an ORM (Prisma, TypeORM, Sequelize) to prevent SQL injection',
      'Command Injection': 'Use execFile() with array arguments or shell escaping libraries. Avoid string concatenation',
      'NoSQL Injection': 'Validate and sanitize input. Use schema validation libraries like Joi or Zod',
      'XSS Vulnerability': 'Use React\'s built-in escaping or DOMPurify. Avoid dangerouslySetInnerHTML',
      'Unsafe String Interpolation': 'Use textContent instead of innerHTML. Sanitize user input with DOMPurify',
      'Unsafe DOM Methods': 'Use React or Vue instead of direct DOM manipulation. Use appendChild() for safe element insertion',
      'Insecure Protocol': 'Always use HTTPS in production. Configure HSTS headers',
      'Insecure Cookie': 'Set Secure, HttpOnly, and SameSite flags on all cookies',
      'Weak Crypto': 'Use strong algorithms: SHA-256+ for hashing, AES-256 for encryption, RSA-2048+ for key exchange',
      'Hardcoded Cipher Key': 'Store encryption keys in a secure vault. Use a key derivation function (PBKDF2, Argon2)',
      'Weak Password Check': 'Enforce minimum 12-character passwords. Use bcrypt, scrypt, or Argon2 for hashing',
      'JWT without Verification': 'Always verify JWT signatures with the correct key and algorithm',
      'Missing CSRF Token': 'Implement CSRF protection using tokens or SameSite cookies',
      'Potential Race Condition': 'Use proper synchronization: locks, mutexes, or avoid shared state. Consider async/await patterns',
      'TOCTOU Vulnerability': 'Check and use files atomically. Handle filesystem errors carefully',
      'Always True Condition': 'This conditional logic is unreachable. Remove or fix the condition',
      'Dead Code': 'Remove unreachable code paths'
    };
    return suggestions[issue] || 'Review and fix the security issue immediately';
  }

  // Calculate cyclomatic complexity of code
  private calculateCyclomaticComplexity(lines: string[]): { complexity: number; level: 'low' | 'medium' | 'high' | 'critical' } {
    let complexity = 1; // Base complexity
    
    lines.forEach((line) => {
      if (!line.startsWith('+')) return;
      const codeLine = line.substring(1);
      
      // Count decision points
      // if, else if, else, ? :, switch, case, for, while, do, catch
      const ifMatches = (codeLine.match(/\bif\s*\(/g) || []).length;
      const elseIfMatches = (codeLine.match(/\belse\s+if\s*\(/g) || []).length;
      const switchMatches = (codeLine.match(/\bswitch\s*\(/g) || []).length;
      const caseMatches = (codeLine.match(/\bcase\s+/g) || []).length;
      const forMatches = (codeLine.match(/\bfor\s*\(/g) || []).length;
      const whileMatches = (codeLine.match(/\bwhile\s*\(/g) || []).length;
      const doMatches = (codeLine.match(/\bdo\s*{/g) || []).length;
      const catchMatches = (codeLine.match(/\bcatch\s*\(/g) || []).length;
      const ternaryMatches = (codeLine.match(/\?[^:]*:/g) || []).length;
      const logicalAnd = (codeLine.match(/&&/g) || []).length;
      const logicalOr = (codeLine.match(/\|\|/g) || []).length;

      complexity += ifMatches + elseIfMatches + switchMatches + caseMatches + 
                   forMatches + whileMatches + doMatches + catchMatches + 
                   ternaryMatches + logicalAnd + logicalOr;
    });

    // Determine complexity level
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (complexity <= 3) level = 'low';
    else if (complexity <= 7) level = 'medium';
    else if (complexity <= 15) level = 'high';
    else level = 'critical';

    return { complexity, level };
  }

  // Detect code duplication within changed code
  private detectCodeDuplication(lines: string[]): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const codeBlocks: Map<string, number[]> = new Map();
    
    // Extract added lines
    const addedLines = lines
      .map((line, index) => ({ content: line.substring(1).trim(), index }))
      .filter(l => l.content && lines[l.index].startsWith('+'));
    
    // Look for duplicate blocks (5+ lines)
    for (let i = 0; i < addedLines.length - 5; i++) {
      const block = addedLines.slice(i, i + 5).map(l => l.content).join('\n');
      
      // Simple hashing for duplicate detection
      const blockHash = Buffer.from(block).toString('base64').slice(0, 20);
      
      if (codeBlocks.has(blockHash)) {
        const previousIndex = codeBlocks.get(blockHash)![0];
        if (i - previousIndex > 5) { // Only flag if not adjacent
          issues.push({
            type: 'suggestion',
            message: 'Potential code duplication detected',
            line: addedLines[i].index + 1,
            file: 'multiple locations',
            suggestion: 'Consider extracting this code into a reusable function or utility',
            severity: 'medium'
          });
        }
      } else {
        codeBlocks.set(blockHash, [i]);
      }
    }
    
    return issues;
  }

  private analyzePerformance(lines: string[], filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    // Performance patterns to check
    const patterns = [
      {
        pattern: /useEffect\(\(\)\s*=>\s*{[^}]*},\s*\[\s*\]\)/,
        message: 'Empty dependency array in useEffect - infinite loop risk',
        suggestion: 'Add required dependencies or add a comment explaining why it\'s empty'
      },
      {
        pattern: /\.map\(.*\.map\(/,
        message: 'Nested array operations detected - O(n²) complexity',
        suggestion: 'Use flatMap, single loop, or optimize data structure for better performance'
      },
      {
        pattern: /new\s+Promise/,
        message: 'Manual Promise creation - consider async/await',
        suggestion: 'Use async/await or existing Promise-based APIs for cleaner code'
      },
      {
        pattern: /setInterval|setTimeout/,
        message: 'Timer usage detected',
        suggestion: 'Ensure proper cleanup in component unmount to prevent memory leaks'
      },
      {
        pattern: /useEffect[^}]*\[.*,/,
        message: 'useEffect with inline objects/arrays in dependencies',
        suggestion: 'Move objects/arrays outside useEffect or use useMemo to prevent unnecessary re-renders'
      },
      {
        pattern: /\.filter\(.*\)\.map\(|\.map\(.*\)\.filter\(/,
        message: 'Multiple array iterations detected',
        suggestion: 'Combine filter and map into one iteration for better performance'
      },
      {
        pattern: /onClick.*=>.*setState|onChange.*=>.*setState/,
        message: 'Direct state mutation in event handler',
        suggestion: 'Ensure state updates are properly batched and optimized'
      },
      {
        pattern: /JSON\.stringify.*JSON\.parse/,
        message: 'JSON stringify/parse cycle detected',
        suggestion: 'This is inefficient. Consider using structural cloning or other methods'
      },
      {
        pattern: /for\s*\([^)]*\{[^}]*for\s*\(/,
        message: 'Nested loops detected - potential O(n²) complexity',
        suggestion: 'Consider refactoring to use maps, sets, or a better data structure'
      },
      {
        pattern: /function.*\{.*function.*\{[^}]*function/,
        message: 'Deeply nested functions detected',
        suggestion: 'Extract nested functions or refactor for better readability and performance'
      },
      {
        pattern: /const.*=.*\[.*\].*\.filter.*\.map/,
        message: 'Creating large intermediate arrays',
        suggestion: 'Use generators or streaming approaches to reduce memory usage'
      },
      {
        pattern: /import.*\n.*import.*\n.*import.*\n.*import.*\n.*import/,
        message: 'Many imports detected - potential bundle size issue',
        suggestion: 'Consider code splitting or lazy loading for unused imports'
      }
    ];

    lines.forEach((line, index) => {
      if (!line.startsWith('+')) return;
      const codeLine = line.substring(1);

      patterns.forEach(({ pattern, message, suggestion }) => {
        if (pattern.test(codeLine)) {
          issues.push({
            type: 'suggestion',
            message: message,
            line: index + 1,
            file: filePath,
            suggestion: suggestion,
            severity: 'medium'
          });
        }
      });
    });

    return issues;
  }

  public static getInstance(): CodeAnalysisService {
    if (!CodeAnalysisService.instance) {
      CodeAnalysisService.instance = new CodeAnalysisService();
    }
    return CodeAnalysisService.instance;
  }

  private calculateFileImpact(file: PRFileChange): number {
    // Calculate impact based on file size, change ratio, and type
    const isTestFile = file.path.includes('test') || file.path.includes('spec');
    const isStyleFile = file.path.endsWith('.css') || file.path.endsWith('.scss');
    const isDocFile = file.path.includes('docs') || file.path.endsWith('.md');
    
    let impactScore = (file.additions + file.deletions) / 10;

    // Adjust score based on file type
    if (isTestFile) impactScore *= 0.5;
    if (isStyleFile) impactScore *= 0.7;
    if (isDocFile) impactScore *= 0.3;

    return Math.min(100, impactScore);
  }

  private groupRelatedChanges(files: PRFileChange[]): ChangeGroup[] {
    const groups: ChangeGroup[] = [];
    const addedFiles = files.filter(f => f.status === 'added');
    const modifiedFiles = files.filter(f => f.status === 'modified');
    const removedFiles = files.filter(f => f.status === 'removed');

    // Group by common patterns
    const byDirectory = new Map<string, PRFileChange[]>();
    files.forEach(file => {
      const dir = file.path.split('/')[0];
      if (!byDirectory.has(dir)) {
        byDirectory.set(dir, []);
      }
      byDirectory.get(dir)!.push(file);
    });

    // Create groups based on patterns
    if (addedFiles.length > 0) {
      groups.push({
        files: addedFiles,
        type: 'addition',
        description: 'New files added'
      });
    }

    if (removedFiles.length > 0) {
      groups.push({
        files: removedFiles,
        type: 'removal',
        description: 'Files removed'
      });
    }

    byDirectory.forEach((dirFiles, dir) => {
      if (dirFiles.length > 1) {
        groups.push({
          files: dirFiles,
          type: 'directory',
          description: `Changes in ${dir} directory`
        });
      }
    });

    return groups;
  }

  private generateChangeSummary(groups: ChangeGroup[], changeTypes: string[]): ChangeSummary {
    const issues: CodeIssue[] = [];
    let impactScore = 0;

    // Analyze change patterns
    if (groups.some(g => g.type === 'directory' && g.files.length > 5)) {
      issues.push({
        type: 'warning',
        message: 'Large number of files changed in a single directory',
        line: 1,
        file: 'multiple files',
        suggestion: 'Consider breaking down changes into smaller, focused PRs',
        severity: 'medium'
      });
      impactScore += 20;
    }

    // Check commit types against files
    const hasTests = groups.some(g => 
      g.files.some(f => f.path.includes('test') || f.path.includes('spec'))
    );
    
    if (changeTypes.includes('feat') && !hasTests) {
      issues.push({
        type: 'suggestion',
        message: 'New feature added without tests',
        line: 1,
        file: 'multiple files',
        suggestion: 'Consider adding tests for the new feature',
        severity: 'medium'
      });
    }

    return { issues, groups, impactScore };
  }

  private generateHighLevelSuggestions(
    stats: { addedLines: number; removedLines: number; modifiedFiles: number; impactScore: number },
    files: PRFileChange[],
    description: string,
    changeTypes: string[]
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Size-based suggestions
    if (stats.modifiedFiles > 10) {
      issues.push({
        type: 'suggestion',
        message: 'Large number of files modified',
        line: 1,
        file: 'multiple files',
        suggestion: 'Consider breaking down the changes into multiple smaller PRs',
        severity: 'medium'
      });
    }

    if (stats.addedLines + stats.removedLines > 500) {
      issues.push({
        type: 'warning',
        message: 'Large change set',
        line: 1,
        file: 'multiple files',
        suggestion: 'Consider splitting the changes or providing more detailed documentation',
        severity: 'medium'
      });
    }

    // Type-based suggestions
    if (changeTypes.includes('refactor') && !description.toLowerCase().includes('refactor')) {
      issues.push({
        type: 'suggestion',
        message: 'Refactoring changes present but not described in PR description',
        line: 1,
        file: 'PR description',
        suggestion: 'Add context about the refactoring changes in the PR description',
        severity: 'low'
      });
    }

    return issues;
  }

  private analyzeFileChanges(file: PRFileChange, prDescription: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    if (!file.content) return issues;

    const lines = file.content.split('\n');

    // Check for breaking changes
    if (this.hasBreakingChanges(lines)) {
      issues.push({
        type: 'warning',
        message: 'Potentially breaking changes detected',
        line: 1,
        file: file.path,
        suggestion: 'Consider updating version number and documenting breaking changes',
        severity: 'high'
      });
    }

    // Collect issues from different analyzers
    issues.push(...this.analyzeDiff(lines, file.path));
    issues.push(...this.checkSecurityIssues(lines, file.path));
    issues.push(...this.analyzePerformance(lines, file.path));
    
    // NEW: Check cyclomatic complexity
    const { complexity, level } = this.calculateCyclomaticComplexity(lines);
    if (level === 'high' || level === 'critical') {
      issues.push({
        type: level === 'critical' ? 'error' : 'warning',
        message: `High cyclomatic complexity detected (${complexity})`,
        line: 1,
        file: file.path,
        suggestion: 'Break down complex logic into smaller functions for better maintainability and testability',
        severity: level === 'critical' ? 'high' : 'medium'
      });
    }
    
    // NEW: Check for code duplication
    issues.push(...this.detectCodeDuplication(lines));

    return issues;
  }

  public async analyzeCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResult> {
    // Check cache first
    const cacheKey = `${request.pullRequestId}-${request.branch}`;
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    try {
      // Get GitHub token from Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      const githubToken = session?.provider_token;

      if (!githubToken) {
        throw new Error('GitHub authentication required');
      }

      // Analyze PR changes
      const issues: CodeIssue[] = [];
      const stats = {
        addedLines: 0,
        removedLines: 0,
        modifiedFiles: request.files.length,
        impactScore: 0
      };

      // Analyze commit messages for change types
      const changeTypes = this.analyzeCommitMessages(request.commits);
      
      // Analyze each file in the PR
      for (const file of request.files) {
        if (!file.content) continue;

        stats.addedLines += file.additions;
        stats.removedLines += file.deletions;

        const fileIssues = this.analyzeFileChanges(file, request.description);
        issues.push(...fileIssues);

        // Calculate impact score based on file type and changes
        stats.impactScore += this.calculateFileImpact(file);
      }

      // Group related changes
      const changeGroups = this.groupRelatedChanges(request.files);
      
      // Generate change summary and suggestions
      const changeSummary = this.generateChangeSummary(changeGroups, changeTypes);
      issues.push(...changeSummary.issues);

      // Add high-level suggestions based on overall changes
      issues.push(...this.generateHighLevelSuggestions(
        stats,
        request.files,
        request.description,
        changeTypes
      ));

      // Calculate metrics for the result
      const result: CodeAnalysisResult = {
        issues: issues,
        metrics: {
          complexity: stats.impactScore, // Complexity based on amount of changes
          coverage: 100 - Math.floor(issues.length * 5), // Lower coverage score based on issues found
          duplications: Math.min(100, stats.modifiedFiles * 20), // Scale based on number of modified files
          issues: {
            errors: issues.filter(i => i.type === 'error').length,
            warnings: issues.filter(i => i.type === 'warning').length,
            suggestions: issues.filter(i => i.type === 'suggestion').length
          }
        }
      };

      // Cache the result
      this.analysisCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Code analysis failed:', error);
      throw error;
    }
  }

  public clearCache(pullRequestId?: string) {
    if (pullRequestId) {
      // Clear specific PR cache
      for (const key of this.analysisCache.keys()) {
        if (key.startsWith(pullRequestId)) {
          this.analysisCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.analysisCache.clear();
    }
  }
}