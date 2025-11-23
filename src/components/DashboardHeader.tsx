import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, User } from 'lucide-react';

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
    <div className="bg-white/5 border-b border-white/10 backdrop-blur-sm mb-8">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo/Brand */}
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              PullWise
            </div>
            <div className="hidden md:flex items-center gap-2 text-white/40 text-sm">
              <span>/</span>
              <span className="capitalize">{currentPage}</span>
            </div>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-3">
            {/* Navigation Buttons */}
            <Button
              onClick={() => navigate('/dashboard')}
              variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              className={currentPage === 'dashboard' 
                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
              }
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>

            <Button
              onClick={() => navigate('/profile')}
              variant={currentPage === 'profile' ? 'default' : 'ghost'}
              size="sm"
              className={currentPage === 'profile' 
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
              }
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>

            {/* User Avatar & Info */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <Avatar className="h-8 w-8 ring-2 ring-purple-500/30">
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
                <AvatarFallback className="text-xs">
                  {profile.name?.charAt(0) || profile.github_username?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-white text-sm font-medium leading-none">
                  {profile.name || profile.github_username}
                </p>
                <p className="text-white/50 text-xs mt-0.5">@{profile.github_username}</p>
              </div>
            </div>

            {/* Sign Out Button */}
            <Button
              onClick={onSignOut}
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
