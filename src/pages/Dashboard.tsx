import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PullRequestsView } from '@/components/PullRequestsView';
import { TrendsView } from '@/components/Trends/TrendsView';
import { SandboxView } from '@/components/Sandbox/SandboxView';
import { DottedSurface } from '@/components/DottedSurface';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  GitFork,
  Star,
  Eye,
  GitBranch,
  Code2,
  Calendar,
  TrendingUp,
  Loader2,
  GitCommit,
  HardDrive,
  TestTube,
  ChevronRight,
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

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316'];

const STAT_CARDS = [
  { key: 'repos', label: 'Repositories', sub: 'Public repos', icon: GitBranch, color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
  { key: 'stars', label: 'Total Stars', sub: 'Across all repos', icon: Star, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  { key: 'forks', label: 'Total Forks', sub: 'Community forks', icon: GitFork, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  { key: 'commits', label: 'Commits', sub: 'All repositories', icon: GitCommit, color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  { key: 'prs', label: 'Pull Requests', sub: 'Created by you', icon: GitBranch, color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  { key: 'watchers', label: 'Watchers', sub: 'Watching repos', icon: Eye, color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
] as const;

const SIDEBAR_ITEMS = [
  { key: 'languages', label: 'Languages', icon: Code2, color: '#a78bfa', activeBg: 'rgba(139,92,246,0.15)' },
  { key: 'top-repos', label: 'Top Repos', icon: Star, color: '#fbbf24', activeBg: 'rgba(251,191,36,0.15)' },
  { key: 'size', label: 'Repo Sizes', icon: HardDrive, color: '#60a5fa', activeBg: 'rgba(96,165,250,0.15)' },
  { key: 'pull-requests', label: 'Pull Requests', icon: GitBranch, color: '#34d399', activeBg: 'rgba(52,211,153,0.15)' },
  { key: 'trends', label: 'Trends', icon: TrendingUp, color: '#f472b6', activeBg: 'rgba(244,114,182,0.15)' },
  { key: 'sandbox', label: 'Sandbox', icon: TestTube, color: '#c084fc', activeBg: 'rgba(192,132,252,0.15)' },
] as const;

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCommits, setTotalCommits] = useState(0);
  const [totalPRs, setTotalPRs] = useState(0);
  const [activeSection, setActiveSection] = useState('languages');

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
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) throw new Error('Profile not found');

        setProfile(profileData);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const providerToken = session?.provider_token;
        if (!providerToken) {
          await signOut();
          navigate('/auth');
          return;
        }

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
            await signOut();
            navigate('/auth');
            return;
          }
          throw new Error(`GitHub API error: ${reposRes.statusText}`);
        }

        const reposData = await reposRes.json();
        setRepositories(reposData);

        try {
          const commitsRes = await fetch(
            `https://api.github.com/search/commits?q=author:${profileData.github_username}&per_page=1`,
            {
              headers: {
                Authorization: `Bearer ${providerToken}`,
                Accept: 'application/vnd.github.cloak-preview+json',
              },
            }
          );
          if (commitsRes.ok) {
            const commitsData = await commitsRes.json();
            setTotalCommits(commitsData.total_count || 0);
          }

          const prsRes = await fetch(
            `https://api.github.com/search/issues?q=author:${profileData.github_username}+type:pr&per_page=1`,
            {
              headers: {
                Authorization: `Bearer ${providerToken}`,
                Accept: 'application/vnd.github+json',
              },
            }
          );
          if (prsRes.ok) {
            const prsData = await prsRes.json();
            setTotalPRs(prsData.total_count || 0);
          }
        } catch (err) {
          console.error('Error fetching commits/PRs:', err);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error instanceof Error) {
          if (error.message.includes('GitHub authentication required') ||
            error.message.includes('GitHub API error: Unauthorized')) {
            await signOut();
            navigate('/auth');
            return;
          }
        }
      } finally {
        setLoading(false);
      }
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

  // Data calculations
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

  const topRepos = [...repositories]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 10);

  const sizeData = repositories
    .sort((a, b) => b.size - a.size)
    .slice(0, 8)
    .map((repo) => ({
      name: repo.name.length > 15 ? repo.name.substring(0, 12) + '...' : repo.name,
      size: (repo.size / 1024).toFixed(2),
    }));

  const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
  const totalWatchers = repositories.reduce((sum, repo) => sum + repo.watchers_count, 0);

  const statValues: Record<string, number> = {
    repos: repositories.length,
    stars: totalStars,
    forks: totalForks,
    commits: totalCommits,
    prs: totalPRs,
    watchers: totalWatchers,
  };

  // Render the active section content
  const renderContent = () => {
    switch (activeSection) {
      case 'languages':
        return (
          <Card className="bg-white/[0.03] border-white/[0.08] backdrop-blur-2xl rounded-2xl h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <div className="p-2.5 bg-purple-500/15 rounded-xl">
                  <Code2 className="h-5 w-5 text-purple-400" />
                </div>
                Language Distribution
                <span className="ml-auto text-sm text-white/40 font-normal">
                  {languageData.length} languages
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {languageData.length > 0 ? (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={languageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                        }
                        outerRadius={110}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                        stroke="rgba(0,0,0,0.3)"
                        strokeWidth={2}
                      >
                        {languageData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '12px',
                          color: 'white',
                          padding: '10px 14px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    {languageData
                      .sort((a, b) => b.value - a.value)
                      .map((lang, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-white text-sm font-medium">{lang.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white/40 text-sm">{lang.value} repos</span>
                            <span className="text-white font-semibold text-sm min-w-[40px] text-right">
                              {((lang.value / repositories.length) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-white/40 text-center py-12">No language data available</div>
              )}
            </CardContent>
          </Card>
        );

      case 'top-repos':
        return (
          <Card className="bg-white/[0.03] border-white/[0.08] backdrop-blur-2xl rounded-2xl h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <div className="p-2.5 bg-yellow-500/15 rounded-xl">
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                Top Repositories by Stars
                <span className="ml-auto text-sm text-white/40 font-normal">
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
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        border: '1px solid rgba(251, 191, 36, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    />
                    <Bar
                      dataKey="stargazers_count"
                      fill="url(#starGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-white/40 text-center py-12">No repository data available</div>
              )}
            </CardContent>
          </Card>
        );

      case 'size':
        return (
          <Card className="bg-white/[0.03] border-white/[0.08] backdrop-blur-2xl rounded-2xl h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <div className="p-2.5 bg-blue-500/15 rounded-xl">
                  <HardDrive className="h-5 w-5 text-blue-400" />
                </div>
                Repository Sizes (MB)
                <span className="ml-auto text-sm text-white/40 font-normal">
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
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                      label={{ value: 'MB', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    />
                    <Bar
                      dataKey="size"
                      fill="url(#sizeGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-white/40 text-center py-12">No repository size data available</div>
              )}
            </CardContent>
          </Card>
        );

      case 'pull-requests':
        return (
          <Card className="bg-white/[0.03] border-white/[0.08] backdrop-blur-2xl rounded-2xl h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <div className="p-2.5 bg-green-500/15 rounded-xl">
                  <GitBranch className="h-5 w-5 text-green-400" />
                </div>
                Pull Requests Analysis
                <span className="ml-auto text-sm text-white/40 font-normal">
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
        );

      case 'trends':
        return <TrendsView />;

      case 'sandbox':
        return <SandboxView />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <DottedSurface />

      <div className="relative z-10">
        <DashboardHeader
          profile={profile}
          currentPage="dashboard"
          onSignOut={signOut}
        />

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Welcome Section */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Welcome back, <span className="text-gradient">{profile.name || profile.github_username}</span>
            </h1>
            <p className="text-white/50 mt-2 text-base">
              Here's an overview of your GitHub activity and repositories.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {STAT_CARDS.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className={`animate-fade-in-${index + 1} card-gradient-border bg-white/[0.04] rounded-xl p-5 backdrop-blur-sm border border-white/[0.06] hover:bg-white/[0.08]`}
                  style={{ borderLeftColor: card.color }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/50 text-sm font-medium tracking-wide uppercase">
                        {card.label}
                      </p>
                      <p className="text-3xl sm:text-4xl font-bold text-white mt-2 tabular-nums">
                        {statValues[card.key]?.toLocaleString()}
                      </p>
                      <p className="text-xs text-white/30 mt-1">{card.sub}</p>
                    </div>
                    <div
                      className="p-3 rounded-xl flex-shrink-0"
                      style={{ backgroundColor: card.bg }}
                    >
                      <Icon className="h-5 w-5" style={{ color: card.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar + Content Layout */}
          <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
            {/* Sidebar Navigation */}
            <div className="lg:w-56 flex-shrink-0">
              <div className="lg:sticky lg:top-20">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 px-3">
                  Analytics
                </p>
                <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                  {SIDEBAR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveSection(item.key)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full text-left group ${isActive
                            ? 'text-white border border-white/[0.1]'
                            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'
                          }`}
                        style={isActive ? { backgroundColor: item.activeBg } : {}}
                      >
                        <Icon
                          className="h-4.5 w-4.5 flex-shrink-0"
                          style={{ color: isActive ? item.color : undefined }}
                        />
                        <span className="flex-1">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="h-3.5 w-3.5 text-white/30 hidden lg:block" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              {renderContent()}
            </div>
          </div>

          {/* Recent Activity */}
          <Card className="mt-8 bg-white/[0.03] border-white/[0.08] backdrop-blur-2xl rounded-2xl animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <div className="p-2.5 bg-blue-500/15 rounded-xl">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                Recent Activity
                <span className="text-sm text-white/40 font-normal ml-1">
                  Most recently updated
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {repositories
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .slice(0, 8)
                  .map((repo, index) => (
                    <div
                      key={repo.id}
                      className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06] hover:bg-white/[0.05] transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {index < 3 && (
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${index === 0 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' :
                                  index === 1 ? 'bg-white/[0.06] text-white/60 border-white/10' :
                                    'bg-orange-500/10 text-orange-400/80 border-orange-500/15'
                                }`}>
                                #{index + 1}
                              </span>
                            )}
                            <a
                              href={repo.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white font-semibold hover:text-purple-300 transition-colors truncate"
                            >
                              {repo.name}
                            </a>
                          </div>
                          <p className="text-white/40 text-sm mt-1.5 line-clamp-1">
                            {repo.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-white/40 text-sm flex-wrap">
                            {repo.language && (
                              <span className="flex items-center gap-1.5">
                                <Code2 className="h-3.5 w-3.5" />
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Star className="h-3.5 w-3.5" />
                              {repo.stargazers_count}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <GitFork className="h-3.5 w-3.5" />
                              {repo.forks_count}
                            </span>
                            <span className="flex items-center gap-1.5 text-blue-400/70">
                              <Calendar className="h-3.5 w-3.5" />
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
