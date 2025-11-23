import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PullRequestsView } from '@/components/PullRequestsView';
import { DottedSurface } from '@/components/DottedSurface';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Footer } from '@/components/Footer';
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
        <DashboardHeader 
          profile={profile} 
          currentPage="dashboard" 
          onSignOut={signOut}
        />
        
        <div className="container mx-auto px-4 py-8">
          {/* Stats Overview - Enhanced with 8 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Repositories */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Repositories</p>
                    <p className="text-3xl font-bold text-white mt-1">{repositories.length}</p>
                    <p className="text-xs text-white/40 mt-1">Public repos</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <GitBranch className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Stars */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Total Stars</p>
                    <p className="text-3xl font-bold text-white mt-1">{totalStars}</p>
                    <p className="text-xs text-white/40 mt-1">Across all repos</p>
                  </div>
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Forks */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Total Forks</p>
                    <p className="text-3xl font-bold text-white mt-1">{totalForks}</p>
                    <p className="text-xs text-white/40 mt-1">Community forks</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <GitFork className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg Stars */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Avg Stars</p>
                    <p className="text-3xl font-bold text-white mt-1">{avgStars}</p>
                    <p className="text-xs text-white/40 mt-1">Per repository</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Followers */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Followers</p>
                    <p className="text-3xl font-bold text-white mt-1">{profile.followers}</p>
                    <p className="text-xs text-white/40 mt-1">GitHub followers</p>
                  </div>
                  <div className="p-3 bg-pink-500/20 rounded-lg">
                    <Users className="h-6 w-6 text-pink-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Following */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Following</p>
                    <p className="text-3xl font-bold text-white mt-1">{profile.following}</p>
                    <p className="text-xs text-white/40 mt-1">Developers</p>
                  </div>
                  <div className="p-3 bg-indigo-500/20 rounded-lg">
                    <UserPlus className="h-6 w-6 text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Watchers */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Watchers</p>
                    <p className="text-3xl font-bold text-white mt-1">{totalWatchers}</p>
                    <p className="text-xs text-white/40 mt-1">Watching repos</p>
                  </div>
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <Eye className="h-6 w-6 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Code Size */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Code Size</p>
                    <p className="text-3xl font-bold text-white mt-1">{totalSizeMB}</p>
                    <p className="text-xs text-white/40 mt-1">MB total</p>
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
              <TabsTrigger 
                value="languages" 
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 transition-colors"
              >
                <Code2 className="h-4 w-4 mr-2" />
                Languages
              </TabsTrigger>
              <TabsTrigger 
                value="top-repos" 
                className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 transition-colors"
              >
                <Star className="h-4 w-4 mr-2" />
                Top Repositories
              </TabsTrigger>
              <TabsTrigger 
                value="size" 
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 transition-colors"
              >
                <HardDrive className="h-4 w-4 mr-2" />
                Repository Sizes
              </TabsTrigger>
              <TabsTrigger 
                value="pull-requests" 
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 transition-colors"
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Pull Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="languages">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Code2 className="h-5 w-5 text-purple-400" />
                    </div>
                    Language Distribution
                    <span className="ml-auto text-sm text-white/60 font-normal">
                      {languageData.length} languages
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {languageData.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Pie Chart */}
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={languageData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                            }
                            outerRadius={100}
                            innerRadius={40}
                            fill="#8884d8"
                            dataKey="value"
                            paddingAngle={2}
                          >
                            {languageData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(0, 0, 0, 0.95)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '8px',
                              color: 'white',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      {/* Legend List */}
                      <div className="flex flex-col justify-center space-y-2">
                        {languageData
                          .sort((a, b) => b.value - a.value)
                          .map((lang, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="text-white text-sm font-medium">{lang.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-white/60 text-sm">{lang.value} repos</span>
                              <span className="text-white font-semibold text-sm">
                                {((lang.value / repositories.length) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-white/60 text-center py-8">No language data available</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="top-repos">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-400" />
                    </div>
                    Top Repositories by Stars
                    <span className="ml-auto text-sm text-white/60 font-normal">
                      Top {Math.min(10, topRepos.length)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topRepos.length > 0 ? (
                    <ResponsiveContainer width="100%" height={450}>
                      <BarChart data={topRepos} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <defs>
                          <linearGradient id="starGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="rgba(255,255,255,0.6)"
                          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.8)' }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.6)" 
                          tick={{ fill: 'rgba(255,255,255,0.8)' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.95)',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            borderRadius: '8px',
                            color: 'white',
                          }}
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Bar 
                          dataKey="stargazers_count" 
                          fill="url(#starGradient)" 
                          radius={[8, 8, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-white/60 text-center py-8">No repository data available</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="size">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <HardDrive className="h-5 w-5 text-blue-400" />
                    </div>
                    Repository Sizes (MB)
                    <span className="ml-auto text-sm text-white/60 font-normal">
                      Top {Math.min(8, sizeData.length)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sizeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={450}>
                      <BarChart data={sizeData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }} layout="horizontal">
                        <defs>
                          <linearGradient id="sizeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="rgba(255,255,255,0.6)"
                          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.8)' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.6)"
                          tick={{ fill: 'rgba(255,255,255,0.8)' }}
                          label={{ value: 'MB', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.6)' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.95)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '8px',
                            color: 'white',
                          }}
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Bar 
                          dataKey="size" 
                          fill="url(#sizeGradient)" 
                          radius={[8, 8, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-white/60 text-center py-8">No repository size data available</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="pull-requests">
              <div className="space-y-4">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <GitBranch className="h-5 w-5 text-green-400" />
                      </div>
                      Pull Requests Analysis
                      <span className="ml-auto text-sm text-white/60 font-normal">
                        Analyze any repository
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="px-6 pb-6">
                      <PullRequestsView />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Recent Repositories - Most Recently Committed */}
          <Card className="mt-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                Recent Activity
                <span className="text-sm text-white/60 font-normal ml-2">
                  (Most recently committed)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {repositories
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .slice(0, 8)
                  .map((repo, index) => (
                  <div
                    key={repo.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                              #{index + 1}
                            </span>
                          )}
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white font-semibold hover:text-blue-400 transition-colors"
                          >
                            {repo.name}
                          </a>
                        </div>
                        <p className="text-white/60 text-sm mt-1 line-clamp-2">
                          {repo.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-white/60 text-sm flex-wrap">
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
                          <span className="flex items-center gap-1 text-blue-400">
                            <Calendar className="h-4 w-4" />
                            Updated {new Date(repo.updated_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: new Date(repo.updated_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                            })}
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
      
      <Footer />
    </div>
  );
};

export default Dashboard;
