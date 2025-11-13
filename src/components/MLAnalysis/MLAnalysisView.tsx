import React from 'react';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { AlertCircle, Brain, Target, AlertTriangle, Lightbulb } from 'lucide-react';
import { Progress } from '../ui/progress';
import type { MLAnalysisResult } from '@/services/MLAnalysisService';

interface MLAnalysisViewProps {
  analysis: MLAnalysisResult | null;
  loading: boolean;
  error?: string | null;
}

export function MLAnalysisView({ analysis, loading, error }: MLAnalysisViewProps) {
  if (loading) {
    return (
      <Card className="p-6 space-y-4 bg-white/5 border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          <div className="h-24 bg-white/10 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 space-y-4 bg-white/5 border-white/10">
        <div className="flex items-center gap-2 text-yellow-500">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <Card className="p-6 space-y-6 bg-white/5 border-white/10">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-white">ML Analysis</h3>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-white/5 rounded-lg">
          <h4 className="text-sm font-medium text-white/80 mb-2">Summary</h4>
          <p className="text-white/60">{analysis.summary}</p>
          {analysis.classification && (
            <div className="mt-2 text-sm text-white/60">
              <strong>Classification:</strong> {analysis.classification.label}
              {analysis.classification.confidence != null && (
                <span className="ml-2">({Math.round((analysis.classification.confidence || 0) * 100)}% confidence)</span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white/80">Impact Score</h4>
              <span className="text-sm text-white/60">{analysis.impact?.score ?? 'N/A'}/100</span>
            </div>
            <Progress
              value={(analysis.impact?.score ?? 0)}
              className={`h-2 ${analysis.impact && analysis.impact.score > 70 ? 'bg-red-500/20' : analysis.impact && analysis.impact.score > 40 ? 'bg-yellow-500/20' : 'bg-green-500/20'}`}
              style={{
                ['--progress-foreground' as string]: analysis.impact && analysis.impact.score > 70 ? '#ef4444' : analysis.impact && analysis.impact.score > 40 ? '#eab308' : '#22c55e'
              }}
            />
            {analysis.explanation?.estimatedEffort && (
              <div className="mt-2 text-sm text-white/60">Estimated effort: {analysis.explanation.estimatedEffort}</div>
            )}
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white/80">Code Quality</h4>
              <span className="text-sm text-white/60">{analysis.codeQuality?.score ?? 'N/A'}/100</span>
            </div>
            <Progress
              value={(analysis.codeQuality?.score ?? 0)}
              className={`h-2 ${analysis.codeQuality && analysis.codeQuality.score > 70 ? 'bg-red-500/20' : analysis.codeQuality && analysis.codeQuality.score > 40 ? 'bg-yellow-500/20' : 'bg-green-500/20'}`}
              style={{
                ['--progress-foreground' as string]: analysis.codeQuality && analysis.codeQuality.score > 70 ? '#ef4444' : analysis.codeQuality && analysis.codeQuality.score > 40 ? '#eab308' : '#22c55e'
              }}
            />
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-white/80" />
              <h4 className="text-sm font-medium text-white/80">Focus Areas</h4>
            </div>
            <ul className="space-y-2">
              {(analysis.recommendations || []).slice(0, 5).map((area, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span className="text-sm text-white/60">{area}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-white/80" />
              <h4 className="text-sm font-medium text-white/80">Recommendations</h4>
            </div>
            <ul className="space-y-2">
              {(analysis.recommendations || []).map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="text-sm text-white/60">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Explanation section with failing code, root cause, minimal patch */}
        {analysis.explanation && (
          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="text-sm font-medium text-white/80 mb-2">Explanation</h4>
            {analysis.explanation.failingCode && (
              <div className="mb-3">
                <h5 className="text-xs text-white/80 mb-1">Failing code</h5>
                <pre className="text-sm bg-black/40 p-2 rounded text-white/60 overflow-x-auto">{analysis.explanation.failingCode}</pre>
              </div>
            )}
            {analysis.explanation.rootCause && (
              <div className="mb-3">
                <h5 className="text-xs text-white/80 mb-1">Root cause</h5>
                <p className="text-sm text-white/60">{analysis.explanation.rootCause}</p>
              </div>
            )}
            {analysis.explanation.minimalPatch && (
              <div className="mb-3">
                <h5 className="text-xs text-white/80 mb-1">Minimal suggested patch</h5>
                <pre className="text-sm bg-black/40 p-2 rounded text-white/60 overflow-x-auto">{analysis.explanation.minimalPatch}</pre>
              </div>
            )}
          </div>
        )}

        {/* Suggested patches */}
        {analysis.suggestedPatches && analysis.suggestedPatches.length > 0 && (
          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="text-sm font-medium text-white/80 mb-2">Suggested Patches</h4>
            <div className="space-y-3">
              {analysis.suggestedPatches.map((p, i) => (
                <div key={i} className="bg-white/3 p-3 rounded">
                  <div className="text-sm text-white/80 font-medium">{p.path}</div>
                  <div className="text-sm text-white/60 mb-2">{p.summary}</div>
                  <pre className="text-sm bg-black/40 p-2 rounded text-white/60 overflow-x-auto">{p.patch}</pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}