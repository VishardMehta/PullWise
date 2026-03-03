import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DottedSurface } from '@/components/DottedSurface';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import {
  MapPin,
  Building2,
  Link as LinkIcon,
  Twitter,
  Users,
  UserPlus,
  GitFork,
  FileText,
  Calendar,
  Loader2,
  Github,
  ExternalLink,
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
  blog: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  github_created_at: string;
  github_updated_at: string;
  raw_user_meta_data: any;
}

const Profile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userReadme, setUserReadme] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  // Fetch user README from GitHub
  useEffect(() => {
    const fetchUserReadme = async () => {
      if (!profile?.github_username) return;

      setReadmeLoading(true);
      try {
        const response = await fetch(
          `https://raw.githubusercontent.com/${profile.github_username}/${profile.github_username}/main/README.md`
        );
        if (response.ok) {
          const text = await response.text();
          setUserReadme(text);
        } else {
          const masterResponse = await fetch(
            `https://raw.githubusercontent.com/${profile.github_username}/${profile.github_username}/master/README.md`
          );
          if (masterResponse.ok) {
            const text = await masterResponse.text();
            setUserReadme(text);
          }
        }
      } catch (error) {
        console.error('Error fetching user README:', error);
      } finally {
        setReadmeLoading(false);
      }
    };

    fetchUserReadme();
  }, [profile?.github_username]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <DottedSurface />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white/60">Loading profile...</p>
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const PROFILE_STATS = [
    { label: 'Repositories', value: profile.public_repos, icon: GitFork, color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Gists', value: profile.public_gists, icon: FileText, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    { label: 'Followers', value: profile.followers, icon: Users, color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
    { label: 'Following', value: profile.following, icon: UserPlus, color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <DottedSurface />

      <div className="relative z-10">
        <DashboardHeader
          profile={profile}
          currentPage="profile"
          onSignOut={signOut}
        />

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Sidebar */}
            <Card className="lg:col-span-1 bg-white/[0.04] border-white/[0.08] backdrop-blur-sm rounded-2xl animate-fade-in-1">
              <CardContent className="pt-8 pb-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-5">
                    <Avatar className="h-28 w-28 ring-4 ring-white/10">
                      <AvatarImage src={profile.avatar_url} alt={profile.name} />
                      <AvatarFallback className="text-3xl bg-white/10 text-white">
                        {profile.name?.charAt(0) || profile.github_username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 p-1.5 bg-green-500/20 rounded-full border-2 border-black">
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-0.5">
                    {profile.name || profile.github_username}
                  </h2>
                  <p className="text-white/40 text-sm mb-4">@{profile.github_username}</p>

                  {profile.bio && (
                    <p className="text-white/60 text-sm mb-5 leading-relaxed max-w-[280px]">{profile.bio}</p>
                  )}

                  {/* View on GitHub Button */}
                  <a
                    href={`https://github.com/${profile.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mb-6"
                  >
                    <Button
                      variant="outline"
                      className="w-full h-10 border-white/10 text-white/70 hover:text-white hover:bg-white/[0.06] hover:border-white/20 rounded-xl transition-all"
                    >
                      <Github className="h-4 w-4 mr-2" />
                      View on GitHub
                      <ExternalLink className="h-3 w-3 ml-auto opacity-40" />
                    </Button>
                  </a>

                  <Separator className="bg-white/[0.06] mb-5" />

                  <div className="w-full space-y-3 text-left">
                    {profile.company && (
                      <div className="flex items-center gap-3 text-white/50 hover:text-white/70 transition-colors">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm truncate">{profile.company}</span>
                      </div>
                    )}

                    {profile.location && (
                      <div className="flex items-center gap-3 text-white/50 hover:text-white/70 transition-colors">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm truncate">{profile.location}</span>
                      </div>
                    )}

                    {profile.blog && (
                      <div className="flex items-center gap-3 text-white/50 hover:text-white/70 transition-colors">
                        <LinkIcon className="h-4 w-4 flex-shrink-0" />
                        <a
                          href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:text-blue-400 truncate transition-colors"
                        >
                          {profile.blog}
                        </a>
                      </div>
                    )}

                    {profile.twitter_username && (
                      <div className="flex items-center gap-3 text-white/50 hover:text-white/70 transition-colors">
                        <Twitter className="h-4 w-4 flex-shrink-0" />
                        <a
                          href={`https://twitter.com/${profile.twitter_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:text-blue-400 transition-colors"
                        >
                          @{profile.twitter_username}
                        </a>
                      </div>
                    )}

                    {profile.email && (
                      <div className="flex items-center gap-3 text-white/50">
                        <span className="text-sm">{profile.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats & Info Panel */}
            <Card className="lg:col-span-2 bg-white/[0.04] border-white/[0.08] backdrop-blur-sm rounded-2xl animate-fade-in-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg">GitHub Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {PROFILE_STATS.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={index}
                        className={`card-gradient-border bg-white/[0.03] rounded-xl p-4 text-center border border-white/[0.06] animate-fade-in-${index + 1}`}
                        style={{ borderLeftColor: stat.color }}
                      >
                        <div
                          className="h-11 w-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                          style={{ backgroundColor: stat.bg }}
                        >
                          <Icon className="h-5 w-5" style={{ color: stat.color }} />
                        </div>
                        <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
                        <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-6 bg-white/[0.06]" />

                {/* Account Information */}
                <div>
                  <h3 className="text-base font-semibold text-white mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <span className="text-white/50 text-sm">GitHub ID</span>
                      <Badge variant="secondary" className="bg-white/[0.06] text-white/80 border-0 font-mono text-xs">
                        {profile.github_id}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <span className="text-white/50 text-sm">Account Created</span>
                      <span className="text-white/80 text-sm flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-white/40" />
                        {formatDate(profile.github_created_at)}
                      </span>
                    </div>

                    {profile.github_updated_at && (
                      <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                        <span className="text-white/50 text-sm">Last Updated</span>
                        <span className="text-white/80 text-sm flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-white/40" />
                          {formatDate(profile.github_updated_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* README Section */}
          {userReadme && (
            <Card className="mt-6 bg-white/[0.04] border-white/[0.08] backdrop-blur-sm max-w-5xl mx-auto rounded-2xl animate-fade-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/15 rounded-xl">
                    <FileText className="h-5 w-5 text-purple-400" />
                  </div>
                  Profile README
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/30 rounded-xl p-6 border border-white/[0.04]">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[[rehypeRaw], [rehypeSanitize]]}
                      components={{
                        h1: ({ ...props }) => <h1 className="text-3xl font-bold text-white mt-6 mb-3 border-b border-white/10 pb-2" {...props} />,
                        h2: ({ ...props }) => <h2 className="text-2xl font-bold text-white mt-5 mb-2 border-b border-white/10 pb-2" {...props} />,
                        h3: ({ ...props }) => <h3 className="text-xl font-semibold text-white mt-4 mb-2" {...props} />,
                        p: ({ ...props }) => <p className="text-white/80 my-3 leading-relaxed" {...props} />,
                        ul: ({ ...props }) => <ul className="list-disc list-inside text-white/80 my-3 space-y-1" {...props} />,
                        ol: ({ ...props }) => <ol className="list-decimal list-inside text-white/80 my-3 space-y-1" {...props} />,
                        li: ({ ...props }) => <li className="text-white/80" {...props} />,
                        blockquote: ({ ...props }) => <blockquote className="border-l-4 border-white/20 pl-4 italic text-white/70 my-3" {...props} />,
                        code: ({ inline, className, children, ...props }: any) =>
                          inline ? (
                            <code className="bg-white/10 text-orange-300 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                              {children}
                            </code>
                          ) : (
                            <pre className="block bg-black/50 text-green-300 p-3 rounded my-2 overflow-x-auto font-mono text-xs" {...props}>
                              <code className={className}>{children}</code>
                            </pre>
                          ),
                        a: ({ href, ...props }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                            {...props}
                          />
                        ),
                        img: ({ src, alt, ...props }) => (
                          <img src={src} alt={alt} className="max-w-full rounded my-4" {...props} />
                        ),
                        table: ({ ...props }) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border border-white/10" {...props} />
                          </div>
                        ),
                        th: ({ ...props }) => <th className="border border-white/10 px-4 py-2 bg-white/5 text-white font-semibold" {...props} />,
                        td: ({ ...props }) => <td className="border border-white/10 px-4 py-2 text-white/80" {...props} />,
                      }}
                    >
                      {userReadme}
                    </ReactMarkdown>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!userReadme && !readmeLoading && (
            <Card className="mt-6 bg-white/[0.04] border-white/[0.08] backdrop-blur-sm max-w-5xl mx-auto rounded-2xl animate-fade-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/15 rounded-xl">
                    <FileText className="h-5 w-5 text-purple-400" />
                  </div>
                  Profile README
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/40 text-sm">
                  No README found. Create a repository named <Badge className="bg-white/10 text-white/70 border-0">{profile.github_username}</Badge> with a README.md file to display your profile here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
