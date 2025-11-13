import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        (async () => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          if (session?.user) {
            await syncUserProfile(session.user);
          }
        })();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const syncUserProfile = async (user: User) => {
    // Prefer enriched data from GitHub API using the provider token when available
    let githubData: any = user.user_metadata || {};

    try {
      const sessionRes = await supabase.auth.getSession();
      const providerToken = sessionRes.data.session?.provider_token as string | undefined;
      if (providerToken) {
        const res = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${providerToken}`,
            Accept: 'application/vnd.github+json',
          },
        });
        if (res.ok) {
          const profile = await res.json();
          githubData = {
            ...githubData,
            sub: profile.id?.toString?.(),
            user_name: profile.login,
            preferred_username: profile.login,
            full_name: profile.name,
            name: profile.name,
            email: githubData.email, // email API may be separate; keep from metadata if present
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            company: profile.company,
            location: profile.location,
            blog: profile.blog,
            twitter_username: profile.twitter_username,
            public_repos: profile.public_repos,
            public_gists: profile.public_gists,
            followers: profile.followers,
            following: profile.following,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          };
        }
      }
    } catch (e) {
      // Non-fatal: fallback to Supabase metadata
      console.warn('GitHub enrichment failed, using basic metadata');
    }

    const profileData = {
      id: user.id,
      github_id: githubData.sub ? parseInt(githubData.sub) : null,
      github_username: githubData.user_name || githubData.preferred_username,
      name: githubData.full_name || githubData.name,
      email: githubData.email || user.email,
      avatar_url: githubData.avatar_url,
      bio: githubData.bio,
      company: githubData.company,
      location: githubData.location,
      blog: githubData.blog,
      twitter_username: githubData.twitter_username,
      public_repos: githubData.public_repos || 0,
      public_gists: githubData.public_gists || 0,
      followers: githubData.followers || 0,
      following: githubData.following || 0,
      github_created_at: githubData.created_at,
      github_updated_at: githubData.updated_at,
      raw_user_meta_data: githubData,
    };

    const { error } = await supabase
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (error) {
      console.error('Error syncing user profile:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
