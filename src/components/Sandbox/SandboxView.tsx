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
  const [creating, setCreating] = useState(false);
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

  const createSandbox = async () => {
    try {
      setCreating(true);
      toast({
        title: 'Creating Sandbox...',
        description: 'This may take 30-60 seconds. Setting up repo, files, and sample PRs.',
      });

      const repo = await sandboxService.createSandboxRepo();
      
      toast({
        title: '✅ Sandbox Created!',
        description: `Repository "${repo.name}" is ready with 3 sample PRs`,
      });

      await loadSandboxRepos();
    } catch (error: any) {
      console.error('Error creating sandbox:', error);
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create sandbox repository',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
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

      await loadSandboxRepos();
    } catch (error: any) {
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
            Testing Sandbox
          </h2>
          <p className="text-sm text-white/60">
            Create temporary repos with sample PRs to practice and learn
          </p>
        </div>
        <Button 
          onClick={createSandbox} 
          disabled={creating}
          className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30"
        >
          {creating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Create New Sandbox
            </>
          )}
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-white/80">
          Sandboxes are temporary GitHub repos with 3 sample PRs (Good, Moderate, Bad). 
          Perfect for learning and testing without affecting your real repositories.
          Delete them anytime!
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
            <h3 className="text-lg font-semibold text-white mb-2">No Sandboxes Yet</h3>
            <p className="text-white/60 mb-6 max-w-md">
              Create your first sandbox to get started with sample PRs and practice analysis
            </p>
            <Button
              onClick={createSandbox}
              disabled={creating}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Sandbox...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Create New Sandbox
                </>
              )}
            </Button>
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

                {/* Sample PRs Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-white/80">✅ Good PR Example</span>
                    <Badge variant="outline" className="ml-auto border-green-500/30 text-green-400">
                      85-95%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <span className="text-white/80">⚠️ Moderate PR</span>
                    <Badge variant="outline" className="ml-auto border-yellow-500/30 text-yellow-400">
                      60-70%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-white/80">❌ Bad PR Example</span>
                    <Badge variant="outline" className="ml-auto border-red-500/30 text-red-400">
                      30-40%
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-black/30 border-white/10 hover:bg-black/50"
                    onClick={() => window.open(repo.html_url, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on GitHub
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-black/30 border-white/10 hover:bg-black/50"
                    onClick={() => window.open(`${repo.html_url}/pulls`, '_blank')}
                  >
                    <GitBranch className="mr-2 h-4 w-4" />
                    View PRs
                  </Button>
                </div>

                <Button
                  variant="destructive"
                  className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30"
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

      {/* Instructions Card */}
      <Card className="bg-black/20 border-white/10 backdrop-blur-2xl">
        <CardHeader>
          <CardTitle className="text-white">How to Use Sandbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                  1
                </span>
                Create Sandbox
              </h4>
              <p className="text-sm text-white/60 pl-8">
                Click "Create New Sandbox" to generate a test repository with sample PRs
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                  2
                </span>
                View PRs
              </h4>
              <p className="text-sm text-white/60 pl-8">
                Click "View PRs" to see the 3 sample pull requests on GitHub
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                  3
                </span>
                Analyze
              </h4>
              <p className="text-sm text-white/60 pl-8">
                Go to Pull Requests tab, paste your sandbox repo URL, and analyze each PR
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                  4
                </span>
                Compare Results
              </h4>
              <p className="text-sm text-white/60 pl-8">
                Compare analysis scores between Good (85-95%), Moderate (60-70%), and Bad (30-40%) PRs
              </p>
            </div>
          </div>

          <Separator className="bg-white/10" />

          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-white/80">
              <strong>Tip:</strong> Use the diff viewer to see exactly what makes a PR good or bad. 
              Compare code patterns and learn best practices!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
