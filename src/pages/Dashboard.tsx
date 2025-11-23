import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PullRequestsView } from '@/components/PullRequestsView';
import { DottedSurface } from '@/components/DottedSurface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  LogOut,
  GitFork,
  Star,
  Eye,
  GitBranch,
  Code2,
  Calendar,
  TrendingUp,
  Loader2,
  User,
  GitCommit,
  Users,
  UserPlus,
  HardDrive,
} from 'lucide-react';

interface UserProfile {
  github_id: number;
  github_username: string;
  name: string;
  email: string;
  avatar_url: string;
  bio: string;
  company: string;
  location: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  github_created_at: string;
}

interface Repository {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string;
  updated_at: string;
  size: number;
}

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) throw new Error('Profile not found');

        setProfile(profileData);

        // Check GitHub token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const providerToken = session?.provider_token;
        if (!providerToken) {
          // Token missing - redirect to re-authenticate
          await signOut();
          navigate('/auth');
          return;
        }

        // Fetch repositories from GitHub API
          const reposRes = await fetch(
          `https://api.github.com/users/${profileData.github_username}/repos?sort=updated&per_page=100`,
          {
            headers: {
              Authorization: `Bearer ${providerToken}`,
              Accept: 'application/vnd.github+json',
            },
          }
        );

        if (!reposRes.ok) {
          if (reposRes.status === 401) {
            // Token expired - redirect to re-authenticate
            await signOut();
            navigate('/auth');
            return;
          }
          throw new Error(`GitHub API error: ${reposRes.statusText}`);
        }

        const reposData = await reposRes.json();
        setRepositories(reposData);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Show error state or handle specific errors
        if (error instanceof Error) {
          if (error.message.includes('GitHub authentication required') || 
              error.message.includes('GitHub API error: Unauthorized')) {
            // Auth issues - redirect to re-authenticate
            await signOut();
            navigate('/auth');
            return;
          }
        }
      } finally {
        setLoading(false);
      }      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <DottedSurface />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <DottedSurface />
        <div className="relative z-10 text-center">
          <p className="text-white/60 mb-4">Profile not found</p>
          <Button onClick={() => navigate('/auth')} variant="outline">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Calculate language distribution
  const languageData = repositories.reduce((acc: any[], repo) => {
    if (repo.language) {
      const existing = acc.find((item) => item.name === repo.language);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: repo.language, value: 1 });
      }
    }
    return acc;
  }, []);

  // Top repositories by stars
  const topRepos = [...repositories]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 10);

  // Repository size data
  const sizeData = repositories
    .sort((a, b) => b.size - a.size)
    .slice(0, 8)
    .map((repo) => ({
      name: repo.name.length > 15 ? repo.name.substring(0, 12) + '...' : repo.name,
      size: (repo.size / 1024).toFixed(2),
    }));

  // Stats overview
  const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
  const totalWatchers = repositories.reduce((sum, repo) => sum + repo.watchers_count, 0);
  const totalSize = repositories.reduce((sum, repo) => sum + repo.size, 0);
  const avgStars = repositories.length > 0 ? (totalStars / repositories.length).toFixed(1) : 0;
  const totalSizeMB = (totalSize / 1024).toFixed(1);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <DottedSurface />

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
                <AvatarFallback>
                  {profile.name?.charAt(0) || profile.github_username?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {profile.name || profile.github_username}
                </h1>
                <p className="text-white/60">@{profile.github_username}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
              <Button
                onClick={signOut}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Stats Overview - Enhanced with 8 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Repositories */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 backdrop-blur-sm hover:border-purple-500/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Repositories</p>
                    <p className="text-3xl font-bold text-white mt-1">{repositories.length}</p>
                    <p className="text-xs text-purple-400 mt-1">Public repos</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <GitBranch className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Stars */}
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 backdrop-blur-sm hover:border-yellow-500/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Total Stars</p>
                    <p className="text-3xl font-bold text-white mt-1">{totalStars}</p>
                    <p className="text-xs text-yellow-400 mt-1">Across all repos</p>
                  </div>
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Forks */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Total Forks</p>
                    <p className="text-3xl font-bold text-white mt-1">{totalForks}</p>
                    <p className="text-xs text-blue-400 mt-1">Community forks</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <GitFork className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg Stars */}
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 backdrop-blur-sm hover:border-green-500/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Avg Stars</p>
                    <p className="text-3xl font-bold text-white mt-1">{avgStars}</p>
                    <p className="text-xs text-green-400 mt-1">Per repository</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Followers */}
            <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20 backdrop-blur-sm hover:border-pink-500/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Followers</p>
                    <p className="text-3xl font-bold text-white mt-1">{profile.followers}</p>
                    <p className="text-xs text-pink-400 mt-1">GitHub followers</p>
                  </div>
                  <div className="p-3 bg-pink-500/20 rounded-lg">
                    <Users className="h-6 w-6 text-pink-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Following */}
            <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 backdrop-blur-sm hover:border-indigo-500/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Following</p>
                    <p className="text-3xl font-bold text-white mt-1">{profile.following}</p>
                    <p className="text-xs text-indigo-400 mt-1">Developers</p>
                  </div>
                  <div className="p-3 bg-indigo-500/20 rounded-lg">
                    <UserPlus className="h-6 w-6 text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Watchers */}
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Watchers</p>
                    <p className="text-3xl font-bold text-white mt-1">{totalWatchers}</p>
                    <p className="text-xs text-cyan-400 mt-1">Watching repos</p>
                  </div>
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <Eye className="h-6 w-6 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Code Size */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 backdrop-blur-sm hover:border-orange-500/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Code Size</p>
                    <p className="text-3xl font-bold text-white mt-1">{totalSizeMB}</p>
                    <p className="text-xs text-orange-400 mt-1">MB total</p>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <HardDrive className="h-6 w-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <Tabs defaultValue="languages" className="w-full">
            <TabsList className="bg-white/5 border-white/10 mb-6">
              <TabsTrigger value="languages" className="data-[state=active]:bg-white/10">
                Languages
              </TabsTrigger>
              <TabsTrigger value="top-repos" className="data-[state=active]:bg-white/10">
                Top Repositories
              </TabsTrigger>
              <TabsTrigger value="size" className="data-[state=active]:bg-white/10">
                Repository Sizes
              </TabsTrigger>
              <TabsTrigger value="pull-requests" className="data-[state=active]:bg-white/10">
                Pull Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="languages">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Language Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={languageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {languageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: 'white',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="top-repos">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Top Repositories by Stars
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topRepos}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="name"
                        stroke="rgba(255,255,255,0.6)"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: 'white',
                        }}
                      />
                      <Bar dataKey="stargazers_count" fill="#fbbf24" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="size">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Repository Sizes (MB)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={sizeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="name"
                        stroke="rgba(255,255,255,0.6)"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: 'white',
                        }}
                      />
                      <Bar dataKey="size" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="pull-requests">
              <PullRequestsView />
            </TabsContent>
          </Tabs>

          {/* Recent Repositories */}
          <Card className="mt-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Recent Repositories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {repositories.slice(0, 5).map((repo) => (
                  <div
                    key={repo.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-semibold hover:underline"
                        >
                          {repo.name}
                        </a>
                        <p className="text-white/60 text-sm mt-1">
                          {repo.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-white/60 text-sm">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <Code2 className="h-4 w-4" />
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {repo.stargazers_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="h-4 w-4" />
                            {repo.forks_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(repo.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
