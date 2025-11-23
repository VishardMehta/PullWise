import React from 'react';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { AlertCircle, Brain, Target, AlertTriangle, Lightbulb, CheckCircle, Shield, Zap, TrendingUp } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import type { MLAnalysisResult } from '@/services/MLAnalysisService';

interface MLAnalysisViewProps {
  analysis: MLAnalysisResult | null;
  loading: boolean;
  error?: string | null;
}

export function MLAnalysisView({ analysis, loading, error }: MLAnalysisViewProps) {
  if (loading) {
    return (
      <Card className="p-6 space-y-4 bg-black/60 border-white/10 backdrop-blur-sm">
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
      <Card className="p-6 space-y-4 bg-black/60 border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-yellow-500">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-6 space-y-4 bg-black/60 border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">AI Code Review</h3>
        </div>
        <div className="text-white/60 text-center py-8">
          No ML analysis data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6 bg-black/60 border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">AI Code Review</h3>
        {analysis.classification && (
          <Badge className="ml-auto text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
            {analysis.classification.label} 
            {analysis.classification.confidence && ` (${Math.round(analysis.classification.confidence * 100)}%)`}
          </Badge>
        )}
      </div>

      {/* Summary Section */}
      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
        <h4 className="text-sm font-medium text-white/80 mb-2">Summary</h4>
        <p className="text-white/60 leading-relaxed">{analysis.summary || 'Analysis in progress...'}</p>
      </div>

      {/* Score Cards - Enhanced */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Impact Score */}
        <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <h4 className="text-sm font-medium text-white/80">Impact</h4>
            </div>
            <span className="text-xs font-bold text-white">
              {analysis.impact?.score ?? 0}/100
            </span>
          </div>
          <Progress
            value={analysis.impact?.score ?? 0}
            className="h-2"
          />
          <p className="text-xs text-white/50 mt-2">
            {analysis.impact?.reason?.split('.')[0]}
          </p>
        </div>

        {/* Code Quality */}
        <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <h4 className="text-sm font-medium text-white/80">Quality</h4>
            </div>
            <span className="text-xs font-bold text-white">
              {analysis.codeQuality?.score ?? 0}/100
            </span>
          </div>
          <Progress
            value={analysis.codeQuality?.score ?? 0}
            className="h-2"
          />
          <p className="text-xs text-white/50 mt-2">
            {analysis.codeQuality?.feedback?.[0] || 'Code quality analysis'}
          </p>
        </div>

        {/* Risk Level */}
        <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-400" />
              <h4 className="text-sm font-medium text-white/80">Risk Level</h4>
            </div>
            {analysis.risks && analysis.risks.length > 0 && (
              <Badge className={`text-xs ${
                analysis.risks.some(r => r.level === 'high') ? 'bg-red-500/20 text-red-300' :
                analysis.risks.some(r => r.level === 'medium') ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-green-500/20 text-green-300'
              }`}>
                {analysis.risks.some(r => r.level === 'high') ? 'High' :
                 analysis.risks.some(r => r.level === 'medium') ? 'Medium' :
                 'Low'}
              </Badge>
            )}
          </div>
          <div className="text-sm text-white/60">
            {analysis.risks?.length || 0} potential issue{(analysis.risks?.length || 0) !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Risks Section */}
      {analysis.risks && analysis.risks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <h4 className="text-sm font-medium text-white/80">Identified Risks</h4>
          </div>
          <div className="space-y-2">
            {analysis.risks.map((risk, i) => (
              <div key={i} className="p-3 bg-white/5 rounded border border-white/10">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-white">
                    {risk.description}
                  </span>
                  <Badge className={`text-xs ${
                    risk.level === 'high' ? 'bg-red-500/20 text-red-300' :
                    risk.level === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {risk.level}
                  </Badge>
                </div>
                {risk.mitigation && (
                  <p className="text-xs text-white/50">💡 {risk.mitigation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-blue-400" />
            <h4 className="text-sm font-medium text-white/80">Recommendations</h4>
          </div>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <TrendingUp className="h-3 w-3 text-green-400 mt-1 flex-shrink-0" />
                <span className="text-white/60">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Best Practices Section */}
      {analysis.bestPractices && (analysis.bestPractices.followed.length > 0 || analysis.bestPractices.violations.length > 0) && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80">Best Practices</h4>
          {analysis.bestPractices.followed.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-green-400 font-medium">✅ Followed:</p>
              {analysis.bestPractices.followed.map((item, i) => (
                <p key={i} className="text-xs text-white/50 ml-3">{item}</p>
              ))}
            </div>
          )}
          {analysis.bestPractices.violations.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-yellow-400 font-medium">⚠️ Violations:</p>
              {analysis.bestPractices.violations.map((item, i) => (
                <p key={i} className="text-xs text-white/50 ml-3">{item}</p>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Explanation section with failing code, root cause, minimal patch */}
      {analysis.explanation && (
        <div className="p-4 bg-black/20 rounded-lg border border-white/10">
          <h4 className="text-sm font-medium text-white/80 mb-3">🔍 Detailed Explanation</h4>
          <div className="space-y-3">
            {analysis.explanation.failingCode && (
              <div>
                <h5 className="text-xs text-white/60 mb-1 font-semibold">Failing Code:</h5>
                <pre className="text-xs bg-black/40 p-2 rounded text-white/60 overflow-x-auto border border-white/10">{analysis.explanation.failingCode}</pre>
              </div>
            )}
            {analysis.explanation.rootCause && (
              <div>
                <h5 className="text-xs text-white/60 mb-1 font-semibold">Root Cause:</h5>
                <p className="text-sm text-white/60">{analysis.explanation.rootCause}</p>
              </div>
            )}
            {analysis.explanation.minimalPatch && (
              <div>
                <h5 className="text-xs text-white/60 mb-1 font-semibold">Suggested Fix:</h5>
                <pre className="text-xs bg-black/40 p-2 rounded text-white/60 overflow-x-auto border border-white/10">{analysis.explanation.minimalPatch}</pre>
              </div>
            )}
            {analysis.explanation.estimatedEffort && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-white/50">⏱️ <strong>Estimated Effort:</strong> {analysis.explanation.estimatedEffort}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggested patches */}
      {analysis.suggestedPatches && analysis.suggestedPatches.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80">💾 Suggested Patches</h4>
          <div className="space-y-3">
            {analysis.suggestedPatches.map((p, i) => (
              <div key={i} className="bg-white/5 p-3 rounded border border-white/10">
                <div className="text-sm text-white/80 font-medium mb-1">{p.path}</div>
                <div className="text-xs text-white/60 mb-2">{p.summary}</div>
                <pre className="text-xs bg-black/40 p-2 rounded text-white/60 overflow-x-auto border border-white/10">{p.patch}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}