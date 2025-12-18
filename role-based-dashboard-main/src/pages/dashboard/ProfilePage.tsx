import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  User, 
  Mail, 
  Building, 
  Shield, 
  Calendar,
  Moon,
  Sun,
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ProfilePage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'manager':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'developer':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Mock profile data - replace with actual API data
  const profileData = {
    name: user.role === 'admin' ? 'Admin User' : 
          user.role === 'manager' ? 'Manager User' : 'Developer User',
    email: `${user.emp_id}@company.com`,
    designation: user.role === 'admin' ? 'System Administrator' : 
                 user.role === 'manager' ? 'Project Manager' : 'Software Developer',
    department: 'Engineering',
    joinDate: '2023-06-15',
    managerId: user.role !== 'admin' ? 'mgr001' : null,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <Button variant="outline" size="sm">
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src="" alt={profileData.name} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(profileData.name)}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="text-xl font-semibold text-foreground">{profileData.name}</h2>
            <p className="text-sm text-muted-foreground mb-3">{profileData.designation}</p>
            
            <Badge className={cn("capitalize", getRoleBadgeColor(user.role))}>
              {user.role === 'developer' ? 'Employee' : user.role}
            </Badge>
            
            <div className="w-full mt-6 pt-6 border-t space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{profileData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{profileData.department}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Joined {new Date(profileData.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Employee ID</Label>
                <Input value={user.emp_id} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Full Name</Label>
                <Input value={profileData.name} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <Input value={profileData.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Designation</Label>
                <Input value={profileData.designation} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Department</Label>
                <Input value={profileData.department} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Role</Label>
                <Input value={user.role === 'developer' ? 'Employee' : user.role} disabled className="bg-muted capitalize" />
              </div>
              {profileData.managerId && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Reports To</Label>
                  <Input value={profileData.managerId} disabled className="bg-muted" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <p className="font-medium text-foreground">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
