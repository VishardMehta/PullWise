import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, Code, FileWarning } from 'lucide-react';

interface CodeIssue {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  line: number;
  file: string;
  suggestion?: string;
  severity: 'high' | 'medium' | 'low';
}

interface CodeAnalysisResult {
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

interface CodeAnalysisViewProps {
  pullRequestId: string;
  analysis?: CodeAnalysisResult;
  loading?: boolean;
  title?: string;
}

export function CodeAnalysisView({ pullRequestId, analysis, loading = false, title = 'Static analysis' }: CodeAnalysisViewProps) {
  const getSeverityColor = (severity: CodeIssue['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getIssueIcon = (type: CodeIssue['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <FileWarning className="h-4 w-4 text-yellow-500" />;
      case 'suggestion':
        return <Code className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Code className="h-5 w-5" />
            Code Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Code className="h-5 w-5" />
            Code Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-white/60 text-center py-8">
            No analysis data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10">
        <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Code className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4 min-w-0">
            <div className="text-sm text-white/60">Complexity</div>
            <div className="text-2xl font-bold text-white mt-1 truncate">
              {Number.isFinite(analysis.metrics.complexity) ? analysis.metrics.complexity.toFixed(2) : 'N/A'}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 min-w-0">
            <div className="text-sm text-white/60">Coverage</div>
            <div className="text-2xl font-bold text-white mt-1 truncate">
              {Number.isFinite(analysis.metrics.coverage) ? Math.round(analysis.metrics.coverage) + '%' : 'N/A'}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 min-w-0">
            <div className="text-sm text-white/60">Duplications</div>
            <div className="text-2xl font-bold text-white mt-1 truncate">
              {Number.isFinite(analysis.metrics.duplications) ? Math.round(analysis.metrics.duplications) + '%' : 'N/A'}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 min-w-0">
            <div className="text-sm text-white/60">Issues</div>
            <div className="text-2xl font-bold text-white mt-1 truncate">
              {analysis.metrics.issues.errors + analysis.metrics.issues.warnings + analysis.metrics.issues.suggestions}
            </div>
          </div>
        </div>

        {/* Issues List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {analysis.issues.map((issue, index) => (
              <div
                key={index}
                className="p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-start gap-3">
                  {getIssueIcon(issue.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium">{issue.file}</span>
                      <span className="text-white/40">Line {issue.line}</span>
                      <Badge
                        className={`ml-auto ${getSeverityColor(issue.severity)}`}
                      >
                        {issue.severity}
                      </Badge>
                    </div>
                    <p className="text-white/80 mb-2">{issue.message}</p>
                    {issue.suggestion && (
                      <div className="bg-white/5 p-3 rounded border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-white/60 text-sm">Suggested Fix:</span>
                        </div>
                        <code className="text-sm text-white/80 font-mono">
                          {issue.suggestion}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}