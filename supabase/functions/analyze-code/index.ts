import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = "AIzaSyBVuPvEvA4QYkho9hZK6tAVTW1Ttb6qpyE";

interface AnalyzeRequest {
  code: string;
  fileName?: string;
  analysisType?: "static" | "ml" | "combined";
}

interface Issue {
  line_number: number;
  issue_type: string;
  severity: "info" | "warning" | "error" | "critical";
  description: string;
  suggestion: string;
  code_snippet: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { code, fileName = "unknown.js", analysisType = "combined" }: AnalyzeRequest = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are an expert code reviewer. Analyze the following code and identify potential issues, bugs, security vulnerabilities, performance problems, and code style issues.

File: ${fileName}
Code:
${code}

Provide your analysis in the following JSON format:
{
  "summary": "Brief overall summary of the code quality",
  "issues": [
    {
      "line_number": <line number>,
      "issue_type": "bug|security|performance|style|best-practice",
      "severity": "info|warning|error|critical",
      "description": "Description of the issue",
      "suggestion": "Specific fix suggestion",
      "code_snippet": "The problematic code snippet"
    }
  ]
}

Be thorough and identify all potential issues. If the code is perfect, return an empty issues array.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let analysisResult;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        analysisResult = {
          summary: "Analysis completed",
          issues: [],
        };
      }
    } catch (parseError) {
      analysisResult = {
        summary: text.substring(0, 500),
        issues: [],
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        analysisType,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error analyzing code:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to analyze code",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});