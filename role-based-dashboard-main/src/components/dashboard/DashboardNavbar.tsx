import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { UserRole } from '@/types/auth';
import { 
  ChevronDown, 
  Shield, 
  Users, 
  Code,
  Bell,
  Search,
  Moon,
  Sun,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface RoleOption {
  role: UserRole;
  label: string;
  icon: React.ElementType;
  color: string;
}

const roleOptions: RoleOption[] = [
  { role: 'admin', label: 'Admin', icon: Shield, color: 'text-red-400' },
  { role: 'manager', label: 'Manager', icon: Users, color: 'text-amber-400' },
  { role: 'developer', label: 'Employee', icon: Code, color: 'text-emerald-400' },
];

const DashboardNavbar = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  // Filter available roles based on current user's role
  const getAvailableRoles = (): RoleOption[] => {
    switch (user.role) {
      case 'admin':
        return roleOptions; // Admin can see all
      case 'manager':
        return roleOptions.filter(r => r.role !== 'admin'); // Manager sees Manager + Employee
      case 'developer':
        return roleOptions.filter(r => r.role === 'developer'); // Developer sees only Employee
      default:
        return [];
    }
  };

  const availableRoles = getAvailableRoles();
  const currentRoleConfig = roleOptions.find(r => r.role === user.role);
  const CurrentIcon = currentRoleConfig?.icon || Shield;

  return (
    <header className="h-16 gradient-navbar border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Left side - Logo and Search */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-navbar-foreground">TaskFlow</span>
        </div>
        
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navbar-foreground/50" />
          <Input 
            placeholder="Search tasks, employees..." 
            className="w-72 pl-9 bg-white/10 border-white/20 text-navbar-foreground placeholder:text-navbar-foreground/50 focus:bg-white/20"
          />
        </div>
      </div>

      {/* Right side - Theme Toggle, Notifications, Profile and Role Dropdown */}
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-navbar-foreground hover:bg-white/10"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-navbar-foreground hover:bg-white/10 relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* Profile Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-navbar-foreground hover:bg-white/10"
          onClick={() => navigate('/dashboard/profile')}
        >
          <User className="w-5 h-5" />
        </Button>

        {/* Role Switcher Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 text-navbar-foreground hover:bg-white/10 px-3 py-2 h-auto"
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                user.role === 'admin' && "bg-red-500/20",
                user.role === 'manager' && "bg-amber-500/20",
                user.role === 'developer' && "bg-emerald-500/20"
              )}>
                <CurrentIcon className={cn("w-4 h-4", currentRoleConfig?.color)} />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium">{user.emp_id}</span>
                <span className={cn("text-xs capitalize", currentRoleConfig?.color)}>
                  {user.role === 'developer' ? 'Employee' : user.role}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 ml-1 text-navbar-foreground/70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-card border-border shadow-lg z-[100]"
          >
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">View As</p>
            </div>
            {availableRoles.map((roleOption) => {
              const Icon = roleOption.icon;
              const isActive = user.role === roleOption.role;
              return (
                <DropdownMenuItem 
                  key={roleOption.role}
                  className={cn(
                    "flex items-center gap-3 py-3 cursor-pointer",
                    isActive && "bg-accent/50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    roleOption.role === 'admin' && "bg-red-100 dark:bg-red-900/30",
                    roleOption.role === 'manager' && "bg-amber-100 dark:bg-amber-900/30",
                    roleOption.role === 'developer' && "bg-emerald-100 dark:bg-emerald-900/30"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      roleOption.role === 'admin' && "text-red-600 dark:text-red-400",
                      roleOption.role === 'manager' && "text-amber-600 dark:text-amber-400",
                      roleOption.role === 'developer' && "text-emerald-600 dark:text-emerald-400"
                    )} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{roleOption.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {roleOption.role === 'admin' && 'Full access to all features'}
                      {roleOption.role === 'manager' && 'Manage tasks and team'}
                      {roleOption.role === 'developer' && 'View and update tasks'}
                    </span>
                  </div>
                  {isActive && (
                    <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground text-xs py-2">
              Role determines your access level
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardNavbar;
