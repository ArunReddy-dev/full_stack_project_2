import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserRole } from "@/types/auth";
import {
  ChevronDown,
  Shield,
  Users,
  Code,
  Bell,
  Search,
  Moon,
  Sun,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface RoleOption {
  role: UserRole;
  label: string;
  icon: React.ElementType;
  color: string;
}

const roleOptions: RoleOption[] = [
  { role: "admin", label: "Admin", icon: Shield, color: "text-red-400" },
  { role: "manager", label: "Manager", icon: Users, color: "text-amber-400" },
  {
    role: "developer",
    label: "Employee",
    icon: Code,
    color: "text-emerald-400",
  },
];

const DashboardNavbar = () => {
  const { user, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        // fetch notifications for current user
        // remark_router: GET /Remark/notifications
        const res = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
          }/Remark/notifications`,
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        // ignore
      }
    };

    load();
    const id = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [user]);

  if (!user) return null;

  // Determine which roles this user can View As.
  // If the backend returned multiple roles for the user, allow those.
  // Additionally, Admins are allowed to assume Manager and Developer views even if not explicitly listed.
  const availableRoles = (() => {
    if (!user) return [];
    const set = new Set<string>();
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      user.roles.forEach((r) => set.add(String(r).toLowerCase()));
    }
    // Admins allowed to assume Manager view (but not Developer directly)
    if (set.has("admin")) {
      set.add("manager");
      // do NOT add developer here — admin should not act as employee/developer
    }
    // If no roles were present, fall back to the active role
    if (set.size === 0 && user.role) set.add(user.role);

    return roleOptions.filter((r) => set.has(r.role));
  })();
  const currentRoleConfig = roleOptions.find((r) => r.role === user.role);
  const CurrentIcon = currentRoleConfig?.icon || Shield;

  const handleSwitch = (r: UserRole) => {
    if (!switchRole) return;
    switchRole(r);
    toast.success(`Now viewing as ${r}`);
  };

  return (
    <header className="h-16 gradient-navbar border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Left side - Logo and Search */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-navbar-foreground">
            TaskFlow
          </span>
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
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-navbar-foreground hover:bg-white/10 relative"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 bg-card border-border shadow-lg">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Notifications
              </p>
            </div>
            {notifications.length === 0 ? (
              <DropdownMenuItem className="text-sm text-muted-foreground py-3">
                No new notifications
              </DropdownMenuItem>
            ) : (
              notifications.map((n: any) => (
                <DropdownMenuItem
                  key={n._id}
                  onClick={async () => {
                    // mark read and navigate to tasks page (open task UI is handled on tasks page)
                    try {
                      const fd = new FormData();
                      fd.append("remark_id", n._id);
                      await fetch(
                        `${
                          import.meta.env.VITE_API_BASE_URL ||
                          "http://localhost:8000"
                        }/Remark/notifications/markread`,
                        {
                          method: "POST",
                          headers: { Authorization: `Bearer ${user?.token}` },
                          body: fd,
                        }
                      );
                    } catch (e) {
                      // ignore
                    }
                    // navigate and open the specific task modal via query param
                    navigate(`/dashboard/tasks?openTask=${n.task_id}`);
                    toast(
                      `Notification opened for task ${
                        n.task_title || n.task_id
                      }`
                    );
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {n.task_title
                        ? `${n.task_title} (#${n.task_id})`
                        : `Task #${n.task_id}`}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {n.comment || "New remark"}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-navbar-foreground hover:bg-white/10"
          onClick={() => navigate("/dashboard/profile")}
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
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  user.role === "admin" && "bg-red-500/20",
                  user.role === "manager" && "bg-amber-500/20",
                  user.role === "developer" && "bg-emerald-500/20"
                )}
              >
                <CurrentIcon
                  className={cn("w-4 h-4", currentRoleConfig?.color)}
                />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium">{user.emp_id}</span>
                <span
                  className={cn("text-xs capitalize", currentRoleConfig?.color)}
                >
                  {user.role === "developer" ? "Employee" : user.role}
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
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                View As
              </p>
            </div>
            {availableRoles.map((roleOption) => {
              const Icon = roleOption.icon;
              const isActive = user.role === roleOption.role;
              return (
                <DropdownMenuItem
                  key={roleOption.role}
                  onClick={() => !isActive && handleSwitch(roleOption.role)}
                  className={cn(
                    "flex items-center gap-3 py-3 cursor-pointer",
                    isActive && "bg-accent/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      roleOption.role === "admin" &&
                        "bg-red-100 dark:bg-red-900/30",
                      roleOption.role === "manager" &&
                        "bg-amber-100 dark:bg-amber-900/30",
                      roleOption.role === "developer" &&
                        "bg-emerald-100 dark:bg-emerald-900/30"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        roleOption.role === "admin" &&
                          "text-red-600 dark:text-red-400",
                        roleOption.role === "manager" &&
                          "text-amber-600 dark:text-amber-400",
                        roleOption.role === "developer" &&
                          "text-emerald-600 dark:text-emerald-400"
                      )}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {roleOption.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {roleOption.role === "admin" &&
                        "Full access to all features"}
                      {roleOption.role === "manager" && "Manage tasks and team"}
                      {roleOption.role === "developer" &&
                        "View and update tasks"}
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
