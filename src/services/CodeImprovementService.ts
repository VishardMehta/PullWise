import { CodeIssue } from './CodeAnalysisService';

export interface ImprovedCode {
  originalCode: string;
  improvedCode: string;
  changes: CodeChange[];
}

export interface CodeChange {
  line: number;
  type: 'security' | 'validation' | 'error-handling' | 'best-practice';
  description: string;
  before: string;
  after: string;
}

export class CodeImprovementService {
  private static instance: CodeImprovementService;

  private constructor() {}

  public static getInstance(): CodeImprovementService {
    if (!CodeImprovementService.instance) {
      CodeImprovementService.instance = new CodeImprovementService();
    }
    return CodeImprovementService.instance;
  }

  /**
   * Apply automatic fixes to code based on analysis issues
   */
  public applyFixes(originalCode: string, issues: CodeIssue[]): ImprovedCode {
    let improvedCode = originalCode;
    const changes: CodeChange[] = [];

    // Sort issues by line number in reverse to maintain line numbers during replacements
    const sortedIssues = [...issues].sort((a, b) => (b.line || 0) - (a.line || 0));

    for (const issue of sortedIssues) {
      const fix = this.generateFix(issue, improvedCode);
      if (fix) {
        improvedCode = fix.code;
        changes.push(fix.change);
      }
    }

    return {
      originalCode,
      improvedCode,
      changes,
    };
  }

  /**
   * Generate a fix for a specific issue
   */
  private generateFix(issue: CodeIssue, code: string): { code: string; change: CodeChange } | null {
    const lines = code.split('\n');
    const lineIndex = (issue.line || 1) - 1;

    // SQL Injection fixes
    if (issue.message.toLowerCase().includes('sql injection')) {
      return this.fixSQLInjection(lines, lineIndex, issue);
    }

    // Password security fixes
    if (issue.message.toLowerCase().includes('password') && 
        (issue.message.toLowerCase().includes('plain') || issue.message.toLowerCase().includes('hash'))) {
      return this.fixPasswordSecurity(lines, lineIndex, issue);
    }

    // Input validation fixes
    if (issue.message.toLowerCase().includes('validation') || 
        issue.message.toLowerCase().includes('sanitize')) {
      return this.addInputValidation(lines, lineIndex, issue);
    }

    // Error handling fixes
    if (issue.message.toLowerCase().includes('error') && 
        issue.message.toLowerCase().includes('handling')) {
      return this.improveErrorHandling(lines, lineIndex, issue);
    }

    // Rate limiting fixes
    if (issue.message.toLowerCase().includes('rate limit')) {
      return this.addRateLimiting(lines, lineIndex, issue);
    }

    return null;
  }

  /**
   * Fix SQL injection vulnerabilities
   */
  private fixSQLInjection(lines: string[], lineIndex: number, issue: CodeIssue): { code: string; change: CodeChange } | null {
    const line = lines[lineIndex];
    
    // Detect string concatenation in SQL queries
    if (line.includes('SELECT') || line.includes('INSERT') || line.includes('UPDATE') || line.includes('DELETE')) {
      const before = line;
      
      // Convert to parameterized query
      let after = line;
      
      // Replace string concatenation with placeholders
      if (line.includes('${') || line.includes('" + ') || line.includes("' + ")) {
        // Extract variable names
        const matches = line.match(/\$\{(\w+)\}|"\s*\+\s*(\w+)|'\s*\+\s*(\w+)/g);
        if (matches) {
          // Replace with parameterized syntax
          after = line.replace(/\$\{(\w+)\}/g, '?');
          after = after.replace(/"\s*\+\s*\w+|\'\s*\+\s*\w+/g, '?');
          
          // Add comment about using parameterized queries
          const indent = line.match(/^\s*/)?.[0] || '';
          lines[lineIndex] = `${indent}// Using parameterized query to prevent SQL injection\n${indent}${after}`;
          
          return {
            code: lines.join('\n'),
            change: {
              line: lineIndex + 1,
              type: 'security',
              description: 'Replaced string concatenation with parameterized query to prevent SQL injection',
              before,
              after,
            },
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Fix password security issues
   */
  private fixPasswordSecurity(lines: string[], lineIndex: number, issue: CodeIssue): { code: string; change: CodeChange } | null {
    const line = lines[lineIndex];
    const before = line;
    
    // Detect plain password comparison
    if (line.includes('password') && (line.includes('===') || line.includes('=='))) {
      const indent = line.match(/^\s*/)?.[0] || '';
      
      // Add bcrypt comparison
      const after = `${indent}// Using bcrypt for secure password comparison\n${indent}const isValid = await bcrypt.compare(password, user.password_hash);`;
      lines[lineIndex] = after;
      
      return {
        code: lines.join('\n'),
        change: {
          line: lineIndex + 1,
          type: 'security',
          description: 'Replaced plain text password comparison with bcrypt hashing',
          before,
          after,
        },
      };
    }
    
    // Detect password storage without hashing
    if (line.includes('password') && (line.includes('INSERT') || line.includes('UPDATE'))) {
      const indent = line.match(/^\s*/)?.[0] || '';
      
      // Add password hashing before storage
      lines.splice(lineIndex, 0, `${indent}// Hash password before storing\n${indent}const hashedPassword = await bcrypt.hash(password, 10);`);
      
      return {
        code: lines.join('\n'),
        change: {
          line: lineIndex + 1,
          type: 'security',
          description: 'Added password hashing with bcrypt before storage',
          before,
          after: lines[lineIndex],
        },
      };
    }
    
    return null;
  }

  /**
   * Add input validation
   */
  private addInputValidation(lines: string[], lineIndex: number, issue: CodeIssue): { code: string; change: CodeChange } | null {
    const line = lines[lineIndex];
    const before = line;
    
    // Add validation before processing user input
    if (line.includes('req.body') || line.includes('params') || line.includes('query')) {
      const indent = line.match(/^\s*/)?.[0] || '';
      
      // Extract variable names
      const varMatch = line.match(/const\s+(\w+)|let\s+(\w+)|var\s+(\w+)/);
      const varName = varMatch ? (varMatch[1] || varMatch[2] || varMatch[3]) : 'input';
      
      // Add validation
      const validation = `${indent}// Validate and sanitize input\n${indent}if (!${varName} || typeof ${varName} !== 'string') {\n${indent}  throw new Error('Invalid input');\n${indent}}\n${indent}`;
      
      lines.splice(lineIndex, 0, validation);
      
      return {
        code: lines.join('\n'),
        change: {
          line: lineIndex + 1,
          type: 'validation',
          description: 'Added input validation and type checking',
          before,
          after: validation + line,
        },
      };
    }
    
    return null;
  }

  /**
   * Improve error handling
   */
  private improveErrorHandling(lines: string[], lineIndex: number, issue: CodeIssue): { code: string; change: CodeChange } | null {
    const line = lines[lineIndex];
    const before = line;
    
    // Wrap in try-catch if not already
    const indent = line.match(/^\s*/)?.[0] || '';
    
    // Check if we're in a function
    if (line.includes('async') || line.includes('function') || line.includes('=>')) {
      return null; // Already in function definition
    }
    
    // Find the next few lines to wrap
    let endIndex = lineIndex + 1;
    while (endIndex < lines.length && lines[endIndex].trim() !== '') {
      endIndex++;
    }
    
    // Add try-catch wrapper
    const wrappedCode = [
      `${indent}try {`,
      ...lines.slice(lineIndex, endIndex).map(l => `  ${l}`),
      `${indent}} catch (error) {`,
      `${indent}  console.error('Error:', error);`,
      `${indent}  throw new Error('Operation failed');`,
      `${indent}}`,
    ];
    
    lines.splice(lineIndex, endIndex - lineIndex, ...wrappedCode);
    
    return {
      code: lines.join('\n'),
      change: {
        line: lineIndex + 1,
        type: 'error-handling',
        description: 'Added try-catch block for proper error handling',
        before,
        after: wrappedCode.join('\n'),
      },
    };
  }

  /**
   * Add rate limiting
   */
  private addRateLimiting(lines: string[], lineIndex: number, issue: CodeIssue): { code: string; change: CodeChange } | null {
    const line = lines[lineIndex];
    const before = line;
    const indent = line.match(/^\s*/)?.[0] || '';
    
    // Add rate limiting middleware suggestion
    const rateLimitCode = `${indent}// Add rate limiting middleware\n${indent}// Example: const rateLimit = require('express-rate-limit');\n${indent}// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));`;
    
    lines.splice(lineIndex, 0, rateLimitCode);
    
    return {
      code: lines.join('\n'),
      change: {
        line: lineIndex + 1,
        type: 'security',
        description: 'Added rate limiting suggestion to prevent brute force attacks',
        before,
        after: rateLimitCode,
      },
    };
  }

  /**
   * Generate improvement summary
   */
  public generateImprovementSummary(changes: CodeChange[]): string {
    const categories: { [key: string]: number } = {};
    
    changes.forEach(change => {
      categories[change.type] = (categories[change.type] || 0) + 1;
    });
    
    const summary = [
      '## Improvements Applied',
      '',
      `Total fixes: ${changes.length}`,
      '',
      '### By Category:',
    ];
    
    Object.entries(categories).forEach(([type, count]) => {
      summary.push(`- **${type.replace('-', ' ').toUpperCase()}**: ${count} fix${count > 1 ? 'es' : ''}`);
    });
    
    summary.push('', '### Detailed Changes:');
    
    changes.forEach((change, index) => {
      summary.push(`${index + 1}. **Line ${change.line}** - ${change.description}`);
    });
    
    return summary.join('\n');
  }
}
