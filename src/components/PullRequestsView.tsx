import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GitPullRequest, Link, MessageSquare, Clock, AlertCircle, CheckCircle2, XCircle, GitCommit, Code } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CodeAnalysisView } from '@/components/CodeAnalysis/CodeAnalysisView';
import { MLAnalysisView } from '@/components/MLAnalysis/MLAnalysisView';
import { CodeAnalysisService } from '@/services/CodeAnalysisService';
import { MLAnalysisService } from '@/services/MLAnalysisService';

interface PullRequest {
  id: number;
  number: number;
  title: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  state: string;
  comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
  body: string;
  head: {
    ref: string;
    sha: string;
    repo: {
      full_name: string;
    };
  };
  base: {
    ref: string;
    sha: string;
    repo: {
      full_name: string;
    };
  };
}

export function PullRequestsView() {
  const { user } = useAuth();
  const [repoUrl, setRepoUrl] = useState('');
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const fetchPullRequests = async () => {
    if (!repoUrl) {
      setError('Please enter a repository URL');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Extract owner and repo from URL
      const urlParts = repoUrl.split('/');
      const owner = urlParts[urlParts.length - 2];
      const repo = urlParts[urlParts.length - 1];

      if (!owner || !repo) {
        setError('Invalid repository URL. Please use the format: https://github.com/owner/repo');
        return;
      }

      // Get GitHub token from Supabase auth
      const sessionRes = await supabase.auth.getSession();
      const providerToken = sessionRes.data.session?.provider_token;

      if (!providerToken) {
        setError('GitHub authentication required');
        return;
      }

      // Fetch pull requests from GitHub API
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${providerToken}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pull requests: ' + response.statusText);
      }

      const data = await response.json();
      setPullRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pull requests');
    } finally {
      setLoading(false);
    }
  };

  const [mlAnalysis, setMlAnalysis] = useState<any>(null);
  const [mlError, setMlError] = useState<string | null>(null);

  const analyzePullRequest = async (pr: PullRequest, forceRefresh: boolean = false) => {
    try {
      // Set selected PR immediately
      setSelectedPR(pr);
      
      // Initialize services to check cache
      const analysisService = CodeAnalysisService.getInstance();
      const mlService = MLAnalysisService.getInstance();
      
      // Only clear cache if force refresh is requested
      if (forceRefresh) {
        analysisService.clearCache(pr.id.toString());
        mlService.clearCache();
        setAnalysisResult(null);
        setMlAnalysis(null);
      }
      
      setAnalysisLoading(true);
      setError(null);
      setMlError(null);

      const sessionRes = await supabase.auth.getSession();
      const providerToken = sessionRes.data.session?.provider_token;

      if (!providerToken) {
        throw new Error('GitHub authentication required');
      }

      const urlParts = repoUrl.split('/');
      const owner = urlParts[urlParts.length - 2];
      const repo = urlParts[urlParts.length - 1];

      // Get PR details
      const prDetailsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}`,
        {
          headers: {
            Authorization: `Bearer ${providerToken}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );
      
      if (!prDetailsResponse.ok) {
        throw new Error('Failed to fetch PR details');
      }
      const prDetails = await prDetailsResponse.json();

      // Get PR commits
      const commitsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/commits`,
        {
          headers: {
            Authorization: `Bearer ${providerToken}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );
      
      if (!commitsResponse.ok) {
        throw new Error('Failed to fetch PR commits');
      }
      const commits = await commitsResponse.json();

      // Get PR files with patches
      const filesResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/files`,
        {
          headers: {
            Authorization: `Bearer ${providerToken}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );

      if (!filesResponse.ok) {
        throw new Error('Failed to fetch PR files');
      }
      const files = await filesResponse.json();
      
      // Process files for analysis
      const processedFiles = files.map((file: any) => ({
        path: file.filename,
        content: file.patch || '',
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        beforeName: file.previous_filename || file.filename
      }));

      // Process commits for analysis
      const processedCommits = commits.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0
      }));

      // Run both analyses in parallel (services already initialized at top)
      const [codeResult, mlResult] = await Promise.all([
        analysisService.analyzeCode({
          pullRequestId: pr.id.toString(),
          repositoryUrl: repoUrl,
          branch: pr.head.ref || 'main',
          title: pr.title,
          description: pr.body || '',
          baseBranch: prDetails.base.ref,
          files: processedFiles,
          commits: processedCommits
        }),
        mlService.analyzeCode({
          title: pr.title,
          description: pr.body || '',
          files: processedFiles.map(f => ({
            path: f.path,
            content: f.content,
            patch: f.patch
          })),
          commits: processedCommits.map(c => ({
            message: c.message,
            additions: c.additions,
            deletions: c.deletions
          }))
        }).catch(error => {
          // Handle ML analysis errors separately
          console.error('ML Analysis Error:', error);
          if (error.message.includes('API key not configured')) {
            setMlError('Gemini API key not configured. Please add it in your profile settings.');
          } else {
            setMlError('ML analysis failed: ' + error.message);
          }
          return null;
        })
      ]);

      console.log('Analysis Results:', { codeResult, mlResult });
      setAnalysisResult(codeResult);
      setMlAnalysis(mlResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze pull request');
      setAnalysisResult(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'open':
        return <GitPullRequest className="h-4 w-4 text-green-400" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'merged':
        return <CheckCircle2 className="h-4 w-4 text-purple-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <GitPullRequest className="h-5 w-5" />
          Pull Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input
            type="text"
            placeholder="Enter repository URL (e.g., https://github.com/owner/repo)"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          <Button
            onClick={fetchPullRequests}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? 'Loading...' : 'Fetch PRs'}
          </Button>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {pullRequests.map((pr) => (
            <div
              key={pr.id}
              className="p-5 bg-white/5 border-white/10 backdrop-blur-2xl rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* PR Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="mt-0.5">
                      {getStateIcon(pr.state)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-semibold hover:text-blue-400 transition-colors text-lg"
                        >
                          {pr.title}
                        </a>
                        <span className="text-white/40 text-sm">#{pr.number}</span>
                      </div>
                      
                      {pr.body && (
                        <p className="text-white/50 text-sm mt-2 line-clamp-2 leading-relaxed">
                          {pr.body}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* PR Metadata */}
                  <div className="flex items-center gap-4 flex-wrap text-white/50 text-xs">
                    <span className="flex items-center gap-1.5">
                      <img 
                        src={pr.user.avatar_url} 
                        alt={pr.user.login}
                        className="w-5 h-5 rounded-full ring-1 ring-white/20"
                      />
                      <span className="font-medium text-white/70">{pr.user.login}</span>
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(pr.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: new Date(pr.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {pr.comments}
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="flex items-center gap-1">
                      <GitCommit className="h-3.5 w-3.5" />
                      {pr.commits || 0}
                    </span>
                  </div>
                </div>

                {/* Analyze Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 shrink-0"
                  onClick={() => analyzePullRequest(pr)}
                >
                  <Code className="h-4 w-4 mr-1.5" />
                  Analyze
                </Button>
              </div>

              {/* If this PR is selected, show the analyses directly below this PR */}
              {selectedPR?.id === pr.id && (
                <div className="mt-6">
                  <Separator className="my-4 bg-white/10" />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    <div className="max-h-[800px] overflow-y-auto pr-2 scrollbar-thin">
                      <div className="text-sm text-white/60 mb-2">Static analysis</div>
                      <CodeAnalysisView
                        pullRequestId={pr.id.toString()}
                        analysis={analysisResult}
                        loading={analysisLoading}
                      />
                    </div>

                    <div className="max-h-[800px] overflow-y-auto pr-2 scrollbar-thin">
                      <div className="text-sm text-white/60 mb-2">ML analysis</div>
                      <MLAnalysisView
                        analysis={mlAnalysis}
                        loading={analysisLoading}
                        error={mlError}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Analysis Results */}
        {selectedPR && (
          <>
            <Separator className="my-6 bg-white/10" />
            <div className="grid grid-cols-2 gap-6">
              <CodeAnalysisView
                pullRequestId={selectedPR.id.toString()}
                analysis={analysisResult}
                loading={analysisLoading}
              />
              <MLAnalysisView
                analysis={mlAnalysis}
                loading={analysisLoading}
                error={mlError}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}