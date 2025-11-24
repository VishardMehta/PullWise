// src/services/MLAnalysisService.ts
import { supabase } from '@/integrations/supabase/client'; // optional - used only to forward auth header if you use Supabase sessions

export interface MLAnalysisRequest {
  title: string;
  description: string;
  files: {
    path: string;
    content: string;
    patch?: string;
  }[];
  commits: {
    message: string;
    additions: number;
    deletions: number;
  }[];
}

export interface MLAnalysisResult {
  summary: string;
  recommendations: string[];
  impact: {
    score: number;
    reason: string;
  };
  risks: {
    level: 'low' | 'medium' | 'high';
    description: string;
    mitigation?: string;
  }[];
  bestPractices: {
    followed: string[];
    violations: string[];
  };
  codeQuality: {
    score: number;
    feedback: string[];
  };
  classification?: {
    label: string;
    confidence?: number;
  };
  suggestedPatches?: Array<{
    path: string;
    summary: string;
    patch: string;
  }>;
  explanation?: {
    failingCode?: string;
    rootCause?: string;
    minimalPatch?: string;
    estimatedEffort?: string;
    impactScore?: number;
  };
}

export class MLAnalysisService {
  private static instance: MLAnalysisService;
  private analysisCache: Map<string, MLAnalysisResult>;

  private constructor() {
    this.analysisCache = new Map();
  }

  public static getInstance(): MLAnalysisService {
    if (!MLAnalysisService.instance) {
      MLAnalysisService.instance = new MLAnalysisService();
    }
    return MLAnalysisService.instance;
  }

  private generateAnalysisPrompt(request: MLAnalysisRequest): string {
    const changesText = request.files
      .map((file) => {
        const safeContent = file.content ? `Content:\n${file.content}\n` : '';
        const safePatch = file.patch ? `Patch:\n${file.patch}\n` : 'Patch:\nNo patch available\n';
        return `File: ${file.path}\n${safePatch}${safeContent}`;
      })
      .join('\n\n');

    const fileCount = request.files.length;
    const totalAdditions = request.commits.reduce((sum, c) => sum + c.additions, 0);
    const totalDeletions = request.commits.reduce((sum, c) => sum + c.deletions, 0);

    const exampleJson = JSON.stringify(
      {
        summary: 'This PR introduces authentication middleware for the API endpoints and adds rate limiting to prevent abuse. The changes improve security posture significantly by implementing JWT validation and request throttling. However, there are some concerns around error handling consistency and the lack of unit tests for the new middleware components.',
        classification: { label: 'security', confidence: 0.92 },
        suggestedPatches: [
          {
            path: 'src/middleware/auth.js',
            summary: 'Add comprehensive error handling for JWT validation to prevent information leakage and improve debugging. Current implementation exposes internal error details.',
            patch: '--- a/src/middleware/auth.js\n+++ b/src/middleware/auth.js\n@@ -15,7 +15,12 @@\n   try {\n     const decoded = jwt.verify(token, SECRET);\n     req.user = decoded;\n-  } catch (err) {\n-    return res.status(401).json({ error: err.message });\n+  } catch (err) {\n+    console.error(\'JWT verification failed:\', err);\n+    if (err.name === \'TokenExpiredError\') {\n+      return res.status(401).json({ error: \'Token expired\' });\n+    }\n+    return res.status(401).json({ error: \'Invalid token\' });\n   }\n'
          }
        ],
        explanation: {
          failingCode: 'catch (err) { return res.status(401).json({ error: err.message }); }',
          rootCause: 'The error handler directly exposes internal JWT library error messages to clients, which can leak implementation details and aid attackers. Different JWT errors (expired, malformed, invalid signature) should be normalized to prevent enumeration attacks.',
          minimalPatch: "Replace generic error.message exposure with specific, sanitized error messages based on error type. Log detailed errors server-side while returning safe messages to clients.",
          estimatedEffort: '30-45 minutes including testing',
          impactScore: 45
        },
        impact: { 
          score: 75, 
          reason: 'This PR significantly improves the security posture of the application by adding authentication and rate limiting, reducing the risk of unauthorized access and DoS attacks. The impact is substantial as it protects all API endpoints. However, the incomplete error handling could leak sensitive implementation details to attackers, which partially reduces the security benefit.' 
        },
        recommendations: [
          'Implement comprehensive unit tests for the authentication middleware, covering valid tokens, expired tokens, malformed tokens, and missing tokens scenarios',
          'Add integration tests to verify the rate limiting behavior under various load conditions',
          'Sanitize all error messages returned to clients to prevent information disclosure - never expose internal error details',
          'Consider implementing a centralized error handling middleware to ensure consistent error responses across all endpoints',
          'Add monitoring and alerting for authentication failures and rate limit violations to detect potential attacks',
          'Document the authentication flow and rate limiting configuration in the API documentation',
          'Implement token refresh mechanism to improve user experience when tokens expire',
          'Add request logging with correlation IDs for better debugging and security auditing',
          'Consider implementing different rate limits for authenticated vs unauthenticated requests',
          'Add health check endpoint that bypasses authentication for monitoring purposes'
        ],
        risks: [
          { 
            level: 'high', 
            description: 'Error messages expose internal JWT implementation details (error.message), potentially revealing the JWT library version and configuration. Attackers could use this information to craft targeted attacks or identify known vulnerabilities in the JWT library.',
            mitigation: 'Implement error sanitization layer that maps internal errors to generic, safe messages. Log detailed errors server-side with correlation IDs for debugging. Use static error messages for all authentication failures.'
          },
          {
            level: 'medium',
            description: 'Rate limiting configuration uses hardcoded values without environment-specific tuning. Production traffic patterns may differ significantly from development, potentially causing legitimate users to be rate-limited or allowing attacks to succeed.',
            mitigation: 'Move rate limit configuration to environment variables or configuration files. Implement different limits for different environments (dev/staging/prod). Add metrics to monitor rate limit hit rates and adjust thresholds based on actual usage patterns.'
          },
          {
            level: 'medium',
            description: 'No tests exist for the new middleware, increasing the risk of regression bugs and making refactoring more difficult. Authentication bugs can have severe security implications.',
            mitigation: 'Add comprehensive test suite covering happy paths, edge cases, and error scenarios. Include tests for token expiration, invalid signatures, missing tokens, and rate limit boundary conditions. Aim for >90% code coverage on security-critical code.'
          },
          {
            level: 'low',
            description: 'Rate limiting uses in-memory storage which will be reset on server restart and won\'t work correctly in multi-instance deployments, potentially allowing rate limit bypass.',
            mitigation: 'Consider using Redis or another distributed cache for rate limiting state in production. Document the current limitation and create a follow-up ticket for implementing distributed rate limiting.'
          }
        ],
        bestPractices: { 
          followed: [
            'Uses industry-standard JWT for authentication instead of custom token implementation',
            'Implements rate limiting to prevent abuse and DoS attacks',
            'Validates JWT signatures to ensure token integrity',
            'Uses environment variables for sensitive configuration (JWT secret)',
            'Implements middleware pattern for cross-cutting concerns',
            'Follows Express.js middleware conventions and patterns',
            'Uses async/await for asynchronous operations',
            'Includes appropriate HTTP status codes (401 for unauthorized)'
          ], 
          violations: [
            'Exposes internal error messages to clients (violation of secure error handling principle) - see auth.js line 23',
            'Missing input validation for token format before JWT verification',
            'No unit tests for security-critical authentication logic (violates testing best practices)',
            'Hardcoded configuration values instead of using environment-specific configs',
            'Missing JSDoc documentation for public middleware functions',
            'No request correlation IDs for debugging and audit logging'
          ] 
        },
        codeQuality: { 
          score: 68, 
          feedback: [
            'Error handling is inconsistent - some endpoints return error objects while others return error strings. Standardize on a single error response format across all endpoints.',
            'Authentication middleware lacks comprehensive input validation. Add explicit checks for Authorization header presence and Bearer token format before attempting JWT verification.',
            'Consider extracting JWT verification logic into a separate utility function for better testability and reusability.',
            'Rate limiting middleware mixes configuration and implementation. Extract configuration to a separate file for better maintainability.',
            'Missing JSDoc comments for exported middleware functions. Add documentation describing parameters, return values, and error conditions.',
            'Authentication middleware has too many responsibilities. Consider splitting into separate middlewares for token extraction, validation, and user loading.',
            'No logging of authentication events. Add structured logging for successful authentications and failures for security monitoring.',
            'Magic numbers in rate limiting configuration (e.g., 100 requests per minute). Define these as named constants with descriptive names.',
            'Consider adding TypeScript or JSDoc type annotations to improve code documentation and catch type-related errors early.',
            'Test coverage is currently 0%. Add unit tests with minimum 80% coverage target for new middleware functions.'
          ] 
        }
      },
      null,
      2
    );

    return `
SYSTEM: You are a highly experienced senior software engineer and code reviewer with expertise in software architecture, security, performance optimization, and best practices. Your task is to provide a COMPREHENSIVE and DETAILED code review.

Produce exactly ONE valid JSON object matching the schema below. Provide in-depth analysis with specific examples and actionable insights. Be thorough but precise.

CONTEXT:
- PR Title: ${request.title}
- PR Description: ${request.description}
- Files Changed: ${fileCount}
- Total Additions: ${totalAdditions}
- Total Deletions: ${totalDeletions}
- Commit Count: ${request.commits.length}

CRITICAL INSTRUCTIONS:
- Provide DETAILED analysis - aim for comprehensive feedback, not brief summaries
- Each recommendation should be specific with clear reasoning and examples
- For risks, provide detailed descriptions and concrete mitigation strategies
- Code quality feedback should include specific code patterns observed and improvements
- Summary should be 3-5 sentences capturing key insights
- Provide at least 5-8 actionable recommendations ranked by priority
- Include specific code snippets in explanations when referencing issues
- Be thorough in best practices analysis - cite specific patterns

OUTPUT REQUIREMENTS:
- Valid JSON matching the schema exactly
- Detailed, specific feedback (not generic advice)
- Evidence-based scores with clear reasoning
- Unified-diff format for patches
- Conservative confidence scores (0.0-1.0) based on actual evidence
- Impact scores: 0-100 (100 = critical production issue)
- Code quality scores: 0-100 (100 = excellent, production-ready code)

ANALYSIS FRAMEWORK - Examine Each Area Thoroughly:

1. SECURITY ANALYSIS:
   - Authentication & Authorization vulnerabilities
   - Input validation and sanitization issues
   - Injection vulnerabilities (SQL, XSS, etc.)
   - Sensitive data exposure
   - Cryptographic weaknesses
   - Dependency vulnerabilities

2. PERFORMANCE REVIEW:
   - Algorithm complexity (O(n) analysis)
   - Database query optimization
   - Memory leaks and resource management
   - Network call efficiency
   - Caching opportunities
   - Scalability concerns

3. CODE QUALITY ASSESSMENT:
   - Code complexity and readability
   - Naming conventions and clarity
   - Function/method size and responsibility
   - Code duplication (DRY principle)
   - Comments and documentation quality
   - Error handling completeness

4. ARCHITECTURE & DESIGN:
   - SOLID principles adherence
   - Design patterns usage
   - Separation of concerns
   - Modularity and reusability
   - API design quality
   - State management

5. TESTING & RELIABILITY:
   - Test coverage completeness
   - Edge case handling
   - Error scenarios coverage
   - Unit vs integration test balance
   - Mock usage appropriateness
   - Test quality and maintainability

6. MAINTAINABILITY:
   - Code organization structure
   - Dependency management
   - Configuration handling
   - Logging and observability
   - Technical debt introduction
   - Future extensibility

SCHEMA:
{
  "summary": string (3-5 comprehensive sentences covering key changes, main improvements, and primary concerns),
  "classification": { "label": string (bug|feature|refactor|security|performance|test|docs), "confidence": number (0.0-1.0) },
  "suggestedPatches": [ { "path": string, "summary": string (detailed explanation), "patch": string (unified diff) } ],
  "explanation": {
    "failingCode": string (specific code snippet with context),
    "rootCause": string (detailed explanation of why the issue exists, including context),
    "minimalPatch": string (comprehensive fix description with reasoning),
    "estimatedEffort": string (realistic time estimate),
    "impactScore": number (0-100, higher = more critical)
  },
  "impact": { "score": number (0-100), "reason": string (detailed explanation of business and technical impact) },
  "recommendations": [string] (8-12 specific, actionable recommendations with clear reasoning, ordered by priority),
  "risks": [ { "level": "low" | "medium" | "high", "description": string (detailed risk description with examples), "mitigation": string (specific, actionable mitigation strategy) } ] (identify 3-6 risks),
  "bestPractices": { "followed": [string] (5-8 specific practices with examples), "violations": [string] (3-6 specific violations with code references) },
  "codeQuality": { "score": number (0-100), "feedback": [string] (6-10 detailed, specific feedback items with examples and suggestions) }
}

EXAMPLE OUTPUT:
${exampleJson}

FILES CHANGED:
${changesText}

COMMITS:
${request.commits.map((c, idx) => `${idx + 1}. "${c.message}" (${c.additions} additions, ${c.deletions} deletions)`).join('\n')}

REVIEW INSTRUCTIONS:
1. Analyze the code changes for correctness, security, and best practices
2. Identify potential bugs, performance issues, or security vulnerabilities
3. Check if the PR follows conventional commit standards
4. Evaluate code quality and maintainability
5. Provide actionable recommendations ordered by priority
6. Output ONLY valid JSON matching the schema above

RETURN ONLY THE JSON OBJECT. NO EXPLANATIONS.
`.trim();
  }

  private async callAnalyzeEndpoint(prompt: string): Promise<any> {
    let authHeader: string | undefined;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && (session as any).access_token) {
        authHeader = `Bearer ${(session as any).access_token}`;
      }
    } catch {
      // ignore
    }

    console.log('--- Sending prompt to Gemini proxy (length:', prompt.length, 'chars) ---');
    console.log(prompt);

    // call backend (assumes vite proxy so keep relative path)
    const res = await fetch('https://pullwise.onrender.com/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      body: JSON.stringify({ prompt })
    });

    const text = await res.text();

    console.log('--- Raw response from Gemini proxy (length:', String(text).length, 'chars) ---');
    console.log(text);

    // Try to parse JSON first (maybe the proxy already returned parsed JSON)
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  public async analyzeCode(request: MLAnalysisRequest): Promise<MLAnalysisResult> {
    const cacheKey = JSON.stringify({
      title: request.title,
      files: request.files.map((f) => ({ path: f.path, patch: f.patch }))
    });

    if (this.analysisCache.has(cacheKey)) {
      console.log('--- Returning cached ML analysis ---');
      return this.analysisCache.get(cacheKey)!;
    }

    try {
      const prompt = this.generateAnalysisPrompt(request);

      // Send prompt and receive response (raw or parsed)
      const response = await this.callAnalyzeEndpoint(prompt);
      
      console.log('--- Full API Response ---');
      console.log(JSON.stringify(response, null, 2));

      // --- Robust extraction / unwrapping of provider response shapes ---
      let rawText: string | null = null;
      let analysisObj: any = null;

      // If response is an object, try to find textual content inside known fields.
      if (response && typeof response === 'object') {
        // direct schema match? (fast path)
        if (response.summary || response.impact || response.codeQuality) {
          analysisObj = response;
        } else {
          // common provider wrappers
          rawText =
            response.candidates?.[0]?.content?.parts?.[0]?.text ??
            response.candidates?.[0]?.content?.text ??
            response.choices?.[0]?.message?.content ??
            response.output?.[0]?.content?.text ??
            response.output?.[0]?.content?.parts?.[0]?.text ??
            response.data?.[0]?.text ??
            null;
        }
      } else if (typeof response === 'string') {
        rawText = response;
      }

      // If we found rawText, clean and extract JSON inside it
      if (rawText) {
        console.log('--- Extracted raw text from provider wrapper (preview 1000 chars) ---');
        console.log(rawText.slice(0, 1000));

        // Strip common triple-backtick fences and leading language tags like ```json
        rawText = rawText.replace(/^\s*```(?:json|js|text)?\s*/i, '');
        rawText = rawText.replace(/\s*```\s*$/i, '');

        // Some providers prepend extra explanation lines; find first {...} block
        const jsonMatch = rawText.match(/(\{[\s\S]*\})/m);
        if (jsonMatch) {
          const jsonText = jsonMatch[1];
          try {
            analysisObj = JSON.parse(jsonText);
            console.log('--- Parsed JSON object from provider text ---');
            console.log(analysisObj);
          } catch (parseErr) {
            console.warn('Failed to parse provider JSON block:', parseErr);
          }
        } else {
          console.warn('No JSON block found inside provider text; rawText preview:', rawText.slice(0, 500));
        }
      }

      // If we still don't have analysisObj, try parsing response directly
      if (!analysisObj) {
        try {
          analysisObj = typeof response === 'string' ? JSON.parse(response) : null;
        } catch {
          // ignore
        }
      }

      // Final fallback: if still nothing, put raw string into summary
      if (!analysisObj) {
        analysisObj = { summary: String(response) };
      }

      // Validate and normalize confidence scores (0.0-1.0)
      if (analysisObj.classification?.confidence !== undefined) {
        const conf = analysisObj.classification.confidence;
        if (typeof conf === 'number') {
          analysisObj.classification.confidence = Math.min(1, Math.max(0, conf));
        }
      }

      // Validate impact and code quality scores (0-100)
      if (analysisObj.impact?.score !== undefined) {
        analysisObj.impact.score = Math.min(100, Math.max(0, analysisObj.impact.score));
      }
      if (analysisObj.codeQuality?.score !== undefined) {
        analysisObj.codeQuality.score = Math.min(100, Math.max(0, analysisObj.codeQuality.score));
      }

      // Validate and limit recommendations (max 10)
      if (Array.isArray(analysisObj.recommendations)) {
        analysisObj.recommendations = analysisObj.recommendations.slice(0, 10);
      }

      // Validate risks
      if (Array.isArray(analysisObj.risks)) {
        analysisObj.risks = analysisObj.risks.filter((r: any) => 
          r.level && ['low', 'medium', 'high'].includes(r.level)
        );
      }

      // Normalize to MLAnalysisResult structure with safe defaults
      const analysis: MLAnalysisResult = {
        summary: analysisObj.summary || '(Unable to generate summary)',
        recommendations: Array.isArray(analysisObj.recommendations) ? analysisObj.recommendations : [],
        impact: analysisObj.impact || { score: 0, reason: analysisObj.impact?.reason || 'No impact assessment available' },
        risks: Array.isArray(analysisObj.risks)
          ? analysisObj.risks.map((r: any) => ({
              level: (r.level || 'medium') as 'low' | 'medium' | 'high',
              description: r.description || String(r),
              mitigation: r.mitigation || 'Review and test thoroughly'
            }))
          : [],
        bestPractices: analysisObj.bestPractices || { followed: [], violations: [] },
        codeQuality: analysisObj.codeQuality || { score: 0, feedback: [] },
        classification: analysisObj.classification || { label: 'unknown', confidence: 0.5 },
        suggestedPatches: analysisObj.suggestedPatches,
        explanation: analysisObj.explanation
      };

      console.log('--- Final normalized analysis object ---');
      console.log(JSON.stringify(analysis, null, 2));

      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('ML analysis failed:', error);
      throw error;
    }
  }

  public clearCache(): void {
    this.analysisCache.clear();
  }
}
