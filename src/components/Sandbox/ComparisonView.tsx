import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  FileCode, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Code,
  Loader2
} from 'lucide-react';

interface ComparisonViewProps {
  originalPR: {
    url: string;
    score: number;
    title: string;
  };
  improvedPR: {
    url: string;
    repoUrl: string;
    score: number;
  };
  improvements: string;
}

export function ComparisonView({ originalPR, improvedPR, improvements }: ComparisonViewProps) {
  // Parse improvements markdown to extract changes
  const parseImprovements = () => {
    const lines = improvements.split('\n');
    const changes: any[] = [];
    let currentChange: any = null;

    lines.forEach(line => {
      if (line.match(/^\d+\./)) {
        // New change item
        if (currentChange) {
          changes.push(currentChange);
        }
        currentChange = {
          description: line.replace(/^\d+\.\s*\*\*Line \d+\*\* - /, ''),
          type: 'fix'
        };
      }
    });

    if (currentChange) {
      changes.push(currentChange);
    }

    return changes;
  };

  const changes = parseImprovements();
  const scoreImprovement = improvedPR.score - originalPR.score;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Code className="h-6 w-6 text-purple-400" />
            PR Improvement Comparison
          </h2>
          <p className="text-sm text-white/60">{originalPR.title}</p>
        </div>
      </div>

      {/* Score Comparison Card */}
      <Card className="bg-black/20 border-white/10 backdrop-blur-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Quality Score Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8 py-6">
            {/* Original Score */}
            <div className="text-center">
              <div className="text-sm text-white/60 mb-2">Original PR</div>
              <div className="relative">
                <div className="text-5xl font-bold text-red-400">{originalPR.score}%</div>
                <Badge variant="outline" className="mt-2 border-red-500/30 text-red-400">
                  Needs Work
                </Badge>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center">
              <ArrowRight className="h-8 w-8 text-purple-400" />
              <div className="text-sm text-green-400 font-semibold mt-2">
                +{scoreImprovement}%
              </div>
            </div>

            {/* Improved Score */}
            <div className="text-center">
              <div className="text-sm text-white/60 mb-2">Improved PR</div>
              <div className="relative">
                <div className="text-5xl font-bold text-green-400">{improvedPR.score}%</div>
                <Badge variant="outline" className="mt-2 border-green-500/30 text-green-400">
                  {improvedPR.score >= 80 ? 'Excellent' : improvedPR.score >= 60 ? 'Good Quality' : 'Improved'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="my-4 bg-white/10" />

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="border-white/10 hover:bg-white/5"
              onClick={() => window.open(originalPR.url, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Original PR
            </Button>
            <Button
              variant="outline"
              className="border-purple-500/30 hover:bg-purple-500/10 text-purple-300"
              onClick={() => window.open(improvedPR.url, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Improved PR
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Improvement Details */}
      <Card className="bg-black/20 border-white/10 backdrop-blur-2xl">
        <CardHeader>
          <CardTitle className="text-white">Improvement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none">
            <pre className="text-sm text-white/80 whitespace-pre-wrap bg-black/30 p-4 rounded-lg border border-white/10 max-h-96 overflow-y-auto">
              {improvements || 'No detailed improvements available. The improved PR contains security fixes and best practices applied to your code.'}
            </pre>
          </div>

          <Separator className="my-4 bg-white/10" />

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30"
              onClick={() => window.open(improvedPR.repoUrl, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Full Repository
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
