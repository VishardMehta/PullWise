import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, LayoutDashboard, User, Github } from 'lucide-react';

interface DashboardHeaderProps {
  profile: {
    name?: string;
    github_username: string;
    avatar_url: string;
  };
  currentPage: 'dashboard' | 'profile';
  onSignOut: () => void;
}

export function DashboardHeader({ profile, currentPage, onSignOut }: DashboardHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 bg-black/80 border-b border-white/10 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo/Brand */}
          <div
            className="text-2xl font-extrabold tracking-tight cursor-pointer text-gradient"
            onClick={() => navigate('/dashboard')}
            role="button"
            tabIndex={0}
          >
            PullWise
          </div>

          {/* Right: Navigation & User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Navigation Buttons */}
            <Button
              onClick={() => navigate(currentPage === 'dashboard' ? '/profile' : '/dashboard')}
              variant="ghost"
              className="h-10 px-4 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              {currentPage === 'dashboard' ? (
                <>
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </>
              ) : (
                <>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </>
              )}
            </Button>

            {/* GitHub Link */}
            <a
              href={`https://github.com/${profile.github_username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
              >
                <Github className="h-4 w-4" />
              </Button>
            </a>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <Avatar className="h-8 w-8 ring-2 ring-white/10">
                <AvatarImage src={profile.avatar_url} alt={profile.name || profile.github_username} />
                <AvatarFallback className="text-xs bg-white/10 text-white">
                  {(profile.name || profile.github_username)?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white/80 hidden md:inline max-w-[120px] truncate">
                {profile.name || profile.github_username}
              </span>
            </div>

            {/* Sign Out Button */}
            <Button
              onClick={onSignOut}
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline text-sm">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
