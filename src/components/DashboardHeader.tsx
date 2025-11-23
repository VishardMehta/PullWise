import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard } from 'lucide-react';

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
          <div className="text-2xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
            PullWise
          </div>

          {/* Right: Navigation & Actions */}
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
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Profile
            </Button>

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
