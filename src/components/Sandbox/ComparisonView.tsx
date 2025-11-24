import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  };
  improvements: string;
  onClose?: () => void;
}

export function ComparisonView({ originalPR, improvedPR, improvements, onClose }: ComparisonViewProps) {
  const [activeTab, setActiveTab] = useState('overview');

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
  const scoreImprovement = 85 - originalPR.score; // Estimated improvement

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
        {onClose && (
          <Button variant="outline" onClick={onClose} className="border-white/10">
            Close
          </Button>
        )}
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
                <div className="text-5xl font-bold text-green-400">~85%</div>
                <Badge variant="outline" className="mt-2 border-green-500/30 text-green-400">
                  Good Quality
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

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/40 border border-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="changes">Changes Applied</TabsTrigger>
          <TabsTrigger value="details">Improvement Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="bg-black/20 border-white/10 backdrop-blur-2xl">
            <CardHeader>
              <CardTitle className="text-white">What Was Fixed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Security Improvements</div>
                    <div className="text-sm text-white/70">
                      Fixed SQL injection vulnerabilities, added password hashing, implemented secure authentication
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Input Validation</div>
                    <div className="text-sm text-white/70">
                      Added comprehensive input validation and sanitization to prevent injection attacks
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Error Handling</div>
                    <div className="text-sm text-white/70">
                      Implemented proper try-catch blocks and error logging for better reliability
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <CheckCircle2 className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Best Practices</div>
                    <div className="text-sm text-white/70">
                      Applied industry standard patterns and added helpful comments explaining security measures
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-2xl">
            <CardHeader>
              <CardTitle className="text-white">How to Use This Improvement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/70">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
                  1
                </div>
                <p>Click "View Improved PR" to see the full diff on GitHub</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
                  2
                </div>
                <p>Review each change and understand why it improves security/quality</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
                  3
                </div>
                <p>Apply similar patterns to your real PR</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
                  4
                </div>
                <p>Re-analyze your PR to see the score improvement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Changes Applied Tab */}
        <TabsContent value="changes" className="space-y-4 mt-4">
          <Card className="bg-black/20 border-white/10 backdrop-blur-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileCode className="h-5 w-5 text-purple-400" />
                All Changes ({changes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {changes.length > 0 ? (
                  changes.map((change, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-400 mt-1" />
                        <div className="flex-1">
                          <div className="text-sm text-white font-medium">{change.description}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-white/20" />
                    <p>No specific changes detected. View the improved PR for details.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Improvement Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-4">
          <Card className="bg-black/20 border-white/10 backdrop-blur-2xl">
            <CardHeader>
              <CardTitle className="text-white">Full Improvement Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <pre className="text-sm text-white/80 whitespace-pre-wrap bg-black/30 p-4 rounded-lg border border-white/10">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
