import { useState } from 'react';
import { TrendingUp, LogOut, User, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { BudgetSettings } from '@/components/BudgetSettings';
import { ExportButtons } from '@/components/ExportButtons';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { ProfileDialog } from '@/components/ProfileDialog';
import { ExpenseRecord } from '@/hooks/useExpenses';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface HeaderProps {
  expenses: ExpenseRecord[];
}

export function Header({ expenses }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <div className="p-2 rounded-lg gradient-primary shadow-glow">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SplitItEasy</h1>
                <p className="text-xs text-muted-foreground">Smart expense management</p>
              </div>
            </div>
            
            {user && (
              <nav className="hidden md:flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className={cn(
                    'gap-2',
                    isActive('/') && 'bg-primary/10 text-primary'
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/groups')}
                  className={cn(
                    'gap-2',
                    isActive('/groups') && 'bg-primary/10 text-primary'
                  )}
                >
                  <Users className="w-4 h-4" />
                  Groups
                </Button>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  {!location.pathname.startsWith('/groups') && <ExportButtons expenses={expenses} />}
                  <BudgetSettings />
                </div>
                <NotificationsDropdown />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {profile?.username?.[0]?.toUpperCase() || <User className="w-3 h-3" />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline max-w-[120px] truncate">
                        {profile?.username || user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="md:hidden"
                      onClick={() => navigate('/')}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="md:hidden"
                      onClick={() => navigate('/groups')}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Groups
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
              </>
            ) : (
              <Button onClick={() => navigate('/auth')}>Sign In</Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
