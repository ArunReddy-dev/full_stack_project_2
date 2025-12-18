import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getNavItemsForRole } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { 
  LogOut, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const DashboardSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const navSections = getNavItemsForRole(user.role);

  return (
    <aside 
      className={cn(
        "h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 sticky top-16",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Collapse Toggle */}
      <div className="h-12 flex items-center justify-end px-3 border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navSections.map((section, idx) => (
          <div key={section.title} className={cn(idx > 0 && "mt-6")}>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                        collapsed && "justify-center"
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 flex-shrink-0", 
                        isActive && "text-sidebar-primary"
                      )} />
                      {!collapsed && (
                        <span>{item.title}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={logout}
          className={cn(
            "text-sidebar-foreground hover:text-destructive hover:bg-destructive/10",
            !collapsed && "w-full justify-start"
          )}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
