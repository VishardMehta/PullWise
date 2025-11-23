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
        summary: 'Short summary of the PR in one or two sentences.',
        classification: { label: 'bug', confidence: 0.95 },
        suggestedPatches: [
          {
            path: 'src/example.js',
            summary: 'Fix null check',
            patch: '--- a/src/example.js\n+++ b/src/example.js\n@@ -10,6 +10,8 @@\n-  if (x) doThing();\n+  if (x != null) doThing();\n'
          }
        ],
        explanation: {
          failingCode: 'const x = obj.prop;',
          rootCause: 'obj can be null; missing guard',
          minimalPatch: "add null check for obj before accessing prop",
          estimatedEffort: '10-20 minutes',
          impactScore: 30
        },
        impact: { score: 30, reason: 'Potential null pointer crash in login flow' },
        recommendations: ['Add guard for obj', 'Add unit test for missing username'],
        risks: [{ level: 'medium', description: 'May change behavior when obj is undefined', mitigation: 'Add tests' }],
        bestPractices: { followed: ['uses named functions'], violations: ['missing guard on input'] },
        codeQuality: { score: 60, feedback: ['Consider smaller functions', 'Add tests for edge cases'] }
      },
      null,
      2
    );

    return `
SYSTEM: You are an expert senior software engineer and code reviewer. Produce exactly ONE valid JSON object matching the schema below and nothing else — no explanation, no Markdown, no surrounding text. If you cannot produce valid JSON for any reason, return a single JSON object: {"error":"<short reason>"}.

CONTEXT:
- PR Title: ${request.title}
- PR Description: ${request.description}
- Files Changed: ${fileCount}
- Total Additions: ${totalAdditions}
- Total Deletions: ${totalDeletions}
- Commit Count: ${request.commits.length}

CONSTRAINTS:
- Output must be valid JSON and must match the schema exactly (fields may be null or empty arrays if unknown).
- Use deterministic output. Prefer factual, conservative answers over speculation.
- Use small unified-diff style patches for suggestedPatches.patch.
- If a field cannot be determined, return null or an empty array. Do not invent data.
- Rate confidence scores on actual code evidence (0.0-1.0 scale)
- Impact score: 0-100 where 100 is critical production issue
- Code quality score: 0-100 where 100 is excellent code
- If changes are large, produce best-effort analysis and note in recommendations

ANALYSIS FOCUS AREAS:
1. Security: potential vulnerabilities, authentication, data handling
2. Performance: inefficient patterns, bottlenecks, scalability issues
3. Maintainability: code readability, complexity, testability
4. Best Practices: SOLID principles, design patterns, error handling
5. Testing: coverage, edge cases, test quality

SCHEMA:
{
  "summary": string (2-3 sentence overview),
  "classification": { "label": string (bug|feature|refactor|security|performance|test|docs), "confidence": number (0.0-1.0) },
  "suggestedPatches": [ { "path": string, "summary": string, "patch": string (unified diff) } ],
  "explanation": {
    "failingCode": string (minimal code snippet),
    "rootCause": string (why the issue exists),
    "minimalPatch": string (brief fix description),
    "estimatedEffort": string (time to fix),
    "impactScore": number (0-100, higher = more critical)
  },
  "impact": { "score": number (0-100), "reason": string },
  "recommendations": [string] (ordered by priority),
  "risks": [ { "level": "low" | "medium" | "high", "description": string, "mitigation": string } ],
  "bestPractices": { "followed": [string], "violations": [string] },
  "codeQuality": { "score": number (0-100), "feedback": [string] }
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
