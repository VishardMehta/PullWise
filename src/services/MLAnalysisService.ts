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

CONSTRAINTS:
- Output must be valid JSON and must match the schema exactly (fields may be null or empty arrays if unknown).
- Use deterministic output. Prefer factual, conservative answers over speculation.
- Use small unified-diff style patches for suggestedPatches.patch.
- If a field cannot be determined, return null or an empty array. Do not invent data.
- If the changes are large (token limits), produce best-effort analysis and note missing context in recommendations.

SCHEMA:
{
  "summary": string,
  "classification": { "label": string, "confidence": number },
  "suggestedPatches": [ { "path": string, "summary": string, "patch": string } ],
  "explanation": {
    "failingCode": string,
    "rootCause": string,
    "minimalPatch": string,
    "estimatedEffort": string,
    "impactScore": number
  },
  "impact": { "score": number, "reason": string },
  "recommendations": [string],
  "risks": [ { "level": "low" | "medium" | "high", "description": string, "mitigation"?: string } ],
  "bestPractices": { "followed": [string], "violations": [string] },
  "codeQuality": { "score": number, "feedback": [string] }
}

EXAMPLE:
${exampleJson}

PR METADATA:
Title: ${request.title}
Description: ${request.description}

FILES (include changed file patch + content when available):
${changesText}

COMMITS:
${request.commits.map((c) => `- ${c.message} (${c.additions} additions, ${c.deletions} deletions)`).join('\n')}

INSTRUCTIONS:
1) Inspect the schema and return exactly one JSON object matching it. No surrounding text.
2) If you include suggestedPatches, ensure they are minimal and apply to the paths listed.
3) For explanation.failingCode include a minimal snippet demonstrating the failing lines.
4) If needed context is missing (for example: full file context, test output), add a short entry in "recommendations" like "Missing context: full file content or failing test logs required."
5) Keep output concise and truthful.

RETURN ONLY THE JSON OBJECT.
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
    const res = await fetch('/api/analyze', {
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
      return this.analysisCache.get(cacheKey)!;
    }

    try {
      const prompt = this.generateAnalysisPrompt(request);

      // Send prompt and receive response (raw or parsed)
      const response = await this.callAnalyzeEndpoint(prompt);

      // --- NEW: robust extraction / unwrapping of provider response shapes ---
      // Many providers wrap the text output in containers like:
      // response.candidates[0].content.parts[0].text
      // response.choices[0].message.content
      // or return an object directly matching the schema.
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
        // Remove ```json or ``` and trailing ```
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
            // fallback: leave analysisObj null and we'll try other strategies
          }
        } else {
          console.warn('No JSON block found inside provider text; rawText preview:', rawText.slice(0, 500));
        }
      }

      // If we still don't have analysisObj, try parsing response directly (if it's a string)
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

      // Normalize to MLAnalysisResult structure with safe defaults
      const analysis: MLAnalysisResult = {
        summary: analysisObj.summary || '',
        recommendations: Array.isArray(analysisObj.recommendations) ? analysisObj.recommendations : [],
        impact: analysisObj.impact || { score: 0, reason: analysisObj.impact?.reason || '' },
        risks: Array.isArray(analysisObj.risks)
          ? analysisObj.risks.map((r: any) => ({
              level: (r.level || 'medium') as 'low' | 'medium' | 'high',
              description: r.description || String(r),
              mitigation: r.mitigation || ''
            }))
          : [],
        bestPractices: analysisObj.bestPractices || { followed: [], violations: [] },
        codeQuality: analysisObj.codeQuality || { score: analysisObj.codeQuality?.score ?? 0, feedback: analysisObj.codeQuality?.feedback || [] },
        classification: analysisObj.classification,
        suggestedPatches: analysisObj.suggestedPatches,
        explanation: analysisObj.explanation
      };

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
