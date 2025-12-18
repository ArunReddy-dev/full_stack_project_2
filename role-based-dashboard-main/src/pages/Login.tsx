import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Lock, User } from 'lucide-react';

const Login = () => {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!empId.trim() || !password.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both Employee ID and Password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await login({ emp_id: empId, password });
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in',
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-glow" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-6">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <div 
          className="gradient-card rounded-2xl border border-border p-8 shadow-card animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="emp_id" className="text-foreground font-medium">
                Employee ID
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="emp_id"
                  type="text"
                  placeholder="Enter your employee ID"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="glow"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Demo Credentials</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-secondary/50 rounded-lg p-2 text-center">
                <p className="text-primary font-medium">Admin</p>
                <p className="text-muted-foreground">admin001</p>
                <p className="text-muted-foreground">admin123</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2 text-center">
                <p className="text-primary font-medium">Manager</p>
                <p className="text-muted-foreground">mgr001</p>
                <p className="text-muted-foreground">manager123</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2 text-center">
                <p className="text-primary font-medium">Developer</p>
                <p className="text-muted-foreground">dev001</p>
                <p className="text-muted-foreground">dev123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p 
          className="text-center text-sm text-muted-foreground mt-6 animate-fade-in"
          style={{ animationDelay: '0.3s' }}
        >
          Secure enterprise portal
        </p>
      </div>
    </div>
  );
};

export default Login;
