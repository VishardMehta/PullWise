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
            {/* Toggle Navigation Button */}
            <Button
              onClick={() => navigate(currentPage === 'dashboard' ? '/profile' : '/dashboard')}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              {currentPage === 'dashboard' ? 'Profile' : 'Dashboard'}
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
