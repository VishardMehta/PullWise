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
      'Hardcoded Secrets': /(['"])(password|secret|key|token|api[_-]?key)\1\s*[:=]\s*['"][^'"]+['"]/i,
      'SQL Injection': /execute\s*\(\s*['"`].*?\$\{.*?\}/i,
      'XSS Vulnerability': /dangerouslySetInnerHTML|innerHTML\s*=/i,
      'Insecure Protocol': /http:\/\//i,
      'Eval Usage': /eval\(|new Function\(/i
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
      'Hardcoded Secrets': 'Move sensitive data to environment variables or secure vault',
      'SQL Injection': 'Use parameterized queries or an ORM',
      'XSS Vulnerability': 'Use safe content rendering methods or DOMPurify',
      'Insecure Protocol': 'Use HTTPS instead of HTTP',
      'Eval Usage': 'Avoid using eval() or new Function(). Use safer alternatives'
    };
    return suggestions[issue] || 'Review and fix the security issue';
  }

  private analyzePerformance(lines: string[], filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    // Performance patterns to check
    const patterns = [
      {
        pattern: /useEffect\(\(\)\s*=>\s*{[^}]*},\s*\[\s*\]\)/,
        message: 'Empty dependency array in useEffect',
        suggestion: 'Add required dependencies or justify the empty array in comments'
      },
      {
        pattern: /\.map\(.*\.map\(/,
        message: 'Nested array operations detected',
        suggestion: 'Consider using a single loop or optimizing data structure'
      },
      {
        pattern: /new\s+Promise/,
        message: 'Manual Promise creation',
        suggestion: 'Use async/await or existing Promise-based APIs when possible'
      },
      {
        pattern: /setInterval|setTimeout/,
        message: 'Timer usage detected',
        suggestion: 'Ensure proper cleanup in component unmount'
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