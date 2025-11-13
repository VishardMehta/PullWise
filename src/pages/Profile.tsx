import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MLAnalysisService } from '@/services/MLAnalysisService';
import { DottedSurface } from '@/components/DottedSurface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  const [geminiKey, setGeminiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keySuccess, setKeySuccess] = useState<string | null>(null);
  const [userReadme, setUserReadme] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);

  // Function to save the Gemini API key
  const saveGeminiKey = async () => {
    if (!geminiKey.trim()) {
      setKeyError('Please enter an API key');
      return;
    }

    setSavingKey(true);
    setKeyError(null);
    setKeySuccess(null);

    try {
      const mlService = MLAnalysisService.getInstance();
      await mlService.setApiKey(geminiKey.trim());
      setKeySuccess('API key saved successfully!');
      setTimeout(() => setKeySuccess(null), 3000); // Clear success message after 3 seconds
    } catch (error) {
      setKeyError(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setSavingKey(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load existing Gemini API key
  useEffect(() => {
    const loadApiKey = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('user_settings')
          .select('gemini_api_key')
          .eq('user_id', user.id)
          .single();

        if (data?.gemini_api_key) {
          setGeminiKey(data.gemini_api_key);
        }
      } catch (error) {
        console.error('Error loading API key:', error);
      }
    };

    loadApiKey();
  }, [user]);

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
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">GitHub Profile</h1>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Dashboard
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
                    <GitFork className="h-6 w-6 text-white/70 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{profile.public_repos}</p>
                    <p className="text-sm text-white/60">Repositories</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <FileText className="h-6 w-6 text-white/70 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{profile.public_gists}</p>
                    <p className="text-sm text-white/60">Gists</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <Users className="h-6 w-6 text-white/70 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{profile.followers}</p>
                    <p className="text-sm text-white/60">Followers</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <UserPlus className="h-6 w-6 text-white/70 mx-auto mb-2" />
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

                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Last Updated:</span>
                      <span className="text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(profile.github_updated_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {profile.raw_user_meta_data && (
                  <>
                    <Separator className="my-6 bg-white/10" />
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Raw Profile Data
                      </h3>
                      <div className="bg-black/30 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-xs text-white/70">
                          {JSON.stringify(profile.raw_user_meta_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                )}

                {userReadme && (
                  <>
                    <Separator className="my-6 bg-white/10" />
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Profile README
                      </h3>
                      <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <div className="prose prose-invert max-w-none text-sm">
                        <ReactMarkdown
                          // enable GitHub-flavored markdown (tables, tasklists, strikethrough)
                          remarkPlugins={[remarkGfm]}
                          // allow HTML inside markdown (use sanitize if content is untrusted)
                          rehypePlugins={[[rehypeRaw], [rehypeSanitize]]}
                          components={{
                            h1: ({ ...props }) => <h1 className="text-3xl font-bold text-white mt-6 mb-3 border-b border-white/10 pb-2" {...props} />,
                            h2: ({ ...props }) => <h2 className="text-2xl font-bold text-white mt-5 mb-2 border-b border-white/10 pb-2" {...props} />,
                            // ...rest of your custom components...
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
                              <img src={src} alt={alt} className="max-w-full rounded my-2" {...props} />
                            ),
                            // etc...
                          }}
                        >
                          {userReadme}
                        </ReactMarkdown>

                        </div>
                      </div>
                    </div>
                  </>
                )}

                {!userReadme && !readmeLoading && (
                  <>
                    <Separator className="my-6 bg-white/10" />
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Profile README
                      </h3>
                      <p className="text-white/60 text-sm">
                        No README found. Create a repository named <Badge className="bg-white/20 text-white">{profile.github_username}</Badge> with a README.md file to display your profile here.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
