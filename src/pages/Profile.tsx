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
  LogOut,
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
          // Try master branch if main doesn't exist
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

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <DottedSurface />

      <div className="relative z-10">
        <DashboardHeader 
          profile={profile} 
          currentPage="profile" 
          onSignOut={signOut}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                    <AvatarFallback className="text-2xl">
                      {profile.name?.charAt(0) || profile.github_username?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <h2 className="text-2xl font-bold text-white mb-1">
                    {profile.name || profile.github_username}
                  </h2>
                  <p className="text-white/60 mb-4">@{profile.github_username}</p>

                  {profile.bio && (
                    <p className="text-white/80 text-sm mb-4">{profile.bio}</p>
                  )}

                  <div className="w-full space-y-3 text-left">
                    {profile.company && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm">{profile.company}</span>
                      </div>
                    )}

                    {profile.location && (
                      <div className="flex items-center gap-2 text-white/70">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{profile.location}</span>
                      </div>
                    )}

                    {profile.blog && (
                      <div className="flex items-center gap-2 text-white/70">
                        <LinkIcon className="h-4 w-4" />
                        <a
                          href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:text-white truncate"
                        >
                          {profile.blog}
                        </a>
                      </div>
                    )}

                    {profile.twitter_username && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Twitter className="h-4 w-4" />
                        <a
                          href={`https://twitter.com/${profile.twitter_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:text-white"
                        >
                          @{profile.twitter_username}
                        </a>
                      </div>
                    )}

                    {profile.email && (
                      <div className="flex items-center gap-2 text-white/70">
                        <span className="text-sm">{profile.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">GitHub Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                      <GitFork className="h-6 w-6 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{profile.public_repos}</p>
                    <p className="text-sm text-white/60">Repositories</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="h-12 w-12 rounded-lg bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{profile.public_gists}</p>
                    <p className="text-sm text-white/60">Gists</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="h-12 w-12 rounded-lg bg-pink-500/20 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-pink-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{profile.public_repos}</p>
                    <p className="text-sm text-white/60">Followers</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="h-12 w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                      <UserPlus className="h-6 w-6 text-indigo-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{profile.following}</p>
                    <p className="text-sm text-white/60">Following</p>
                  </div>
                </div>

                <Separator className="my-6 bg-white/10" />

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">GitHub ID:</span>
                      <Badge variant="secondary" className="bg-white/10 text-white">
                        {profile.github_id}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Account Created:</span>
                      <span className="text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(profile.github_created_at)}
                      </span>
                    </div>

                    {profile.github_updated_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Last Updated:</span>
                        <span className="text-white flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(profile.github_updated_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {profile.raw_user_meta_data && (
                  <>
                    <Separator className="my-6 bg-white/10" />
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Raw Profile Data
                      </h3>
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-5 border border-white/10">
                        <pre className="text-xs text-white/80 font-mono leading-6">
                          {JSON.stringify(profile.raw_user_meta_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* README Section - Full Width Below */}
          {userReadme && (
            <Card className="mt-6 bg-white/5 border-white/10 backdrop-blur-sm max-w-5xl mx-auto">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Profile README</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/30 rounded-lg p-6">
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
            <Card className="mt-6 bg-white/5 border-white/10 backdrop-blur-sm max-w-5xl mx-auto">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Profile README</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/60 text-sm">
                  No README found. Create a repository named <Badge className="bg-white/20 text-white">{profile.github_username}</Badge> with a README.md file to display your profile here.
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
