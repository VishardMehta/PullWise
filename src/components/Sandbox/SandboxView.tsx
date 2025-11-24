import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TestTube, 
  Loader2, 
  ExternalLink, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  GitBranch,
  FileCode,
  Info
} from 'lucide-react';
import { SandboxService, SandboxRepo } from '@/services/SandboxService';
import { useToast } from '@/hooks/use-toast';

export function SandboxView() {
  const [sandboxRepos, setSandboxRepos] = useState<SandboxRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const sandboxService = SandboxService.getInstance();

  useEffect(() => {
    loadSandboxRepos();
  }, []);

  const loadSandboxRepos = async () => {
    try {
      setLoading(true);
      const repos = await sandboxService.listSandboxRepos();
      setSandboxRepos(repos);
    } catch (error: any) {
      console.error('Error loading sandbox repos:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load sandbox repositories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSandbox = async (repoFullName: string) => {
    if (!confirm(`Delete ${repoFullName}? This cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(repoFullName);
      await sandboxService.deleteSandboxRepo(repoFullName);
      
      toast({
        title: 'Deleted',
        description: 'Sandbox repository deleted successfully',
      });

      // Remove from local state immediately
      setSandboxRepos(prev => prev.filter(repo => repo.full_name !== repoFullName));
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete repository',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <TestTube className="h-6 w-6 text-purple-400" />
            Improved PRs Sandbox
          </h2>
          <p className="text-sm text-white/60">
            View automatically improved versions of your PRs with security fixes and best practices applied
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-white/80">
          When you click "Improve in Sandbox" on an analyzed PR, we create a temporary GitHub repo
          with your original code and an improved version showing security fixes and best practices.
        </AlertDescription>
      </Alert>

      {/* Sandbox List */}
      {loading ? (
        <Card className="bg-black/20 border-white/10 backdrop-blur-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </CardContent>
        </Card>
      ) : sandboxRepos.length === 0 ? (
        <Card className="bg-black/20 border-white/10 backdrop-blur-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <TestTube className="h-16 w-16 text-white/20 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Improved PRs Yet</h3>
            <p className="text-white/60 mb-6 max-w-md">
              Analyze a PR in the Pull Requests tab, then click "Improve in Sandbox" to see an automatically improved version
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {sandboxRepos.map((repo) => (
            <Card key={repo.id} className="bg-black/20 border-white/10 backdrop-blur-2xl">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileCode className="h-5 w-5 text-purple-400" />
                      {repo.name}
                    </CardTitle>
                    <CardDescription className="text-white/60 mt-1">
                      Created {new Date(repo.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-white/70">{repo.description}</p>

                <Separator className="bg-white/10" />

                {/* Original PR Info */}
                {repo.original_pr_url && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-white/90">Original PR</div>
                    <a
                      href={repo.original_pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Original
                    </a>
                    {repo.original_score && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/60">Score:</span>
                        <Badge variant="outline" className="border-red-500/30 text-red-400">
                          {repo.original_score}%
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                <Separator className="bg-white/10" />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5"
                    onClick={() => window.open(repo.html_url, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Repo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5"
                    onClick={() => window.open(`${repo.html_url}/pulls`, '_blank')}
                  >
                    <GitBranch className="mr-2 h-4 w-4" />
                    View Improvements
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => deleteSandbox(repo.full_name)}
                  disabled={deleting === repo.full_name}
                >
                  {deleting === repo.full_name ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Sandbox
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card className="bg-black/20 border-white/10 backdrop-blur-2xl">
        <CardHeader>
          <CardTitle className="text-white">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-white/70">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
              1
            </div>
            <p>Analyze a PR in the Pull Requests tab to get security and quality insights</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
              2
            </div>
            <p>Click "Improve in Sandbox" to create a temporary repo with fixes applied</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
              3
            </div>
            <p>Review the improved PR to see what changed and why (SQL fixes, validation, error handling, etc.)</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
              4
            </div>
            <p>Apply learnings to your real PR and delete the sandbox when done</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
