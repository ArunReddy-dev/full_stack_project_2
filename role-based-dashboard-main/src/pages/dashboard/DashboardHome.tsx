import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import StatsCard from "@/components/dashboard/StatsCard";
import api from "@/lib/api";
import {
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const DashboardHome = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getRoleDescription = () => {
    switch (user?.role) {
      case "admin":
        return "You have full access to all system features.";
      case "manager":
        return "Manage your team and oversee task progress.";
      case "developer":
        return "View and update your assigned tasks.";
      default:
        return "";
    }
  };

  // live stats
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [inProgressCount, setInProgressCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  const mapRoleToBackend = (r?: string) => {
    if (!r) return "Developer";
    if (r === "admin") return "Admin";
    if (r === "manager") return "Manager";
    return "Developer";
  };

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      try {
        // employees
        const emps: any = await api.get("/Employee/getall");
        if (!mounted) return;
        setTotalEmployees(Array.isArray(emps) ? emps.length : 0);

        // tasks
        const roleParam = mapRoleToBackend(user?.role);
        const tasks: any = await api.get(`/Task/getall?role=${roleParam}`);
        if (!mounted) return;
        const list = Array.isArray(tasks) ? tasks : [];
        // normalize status checks: backend may return 'to_do' etc.
        const normalize = (s: any) => {
          if (!s && s !== 0) return "";
          const low = String(s).toLowerCase();
          if (low.includes("to_do") || low === "to_do") return "TO_DO";
          if (low.includes("in_progress") || low === "in_progress")
            return "IN_PROGRESS";
          if (low.includes("review") || low === "review") return "REVIEW";
          if (low.includes("done") || low === "done") return "DONE";
          // also accept frontend enum
          if (low === "to_do" || low === "todo") return "TO_DO";
          return String(s).toUpperCase();
        };

        let inProg = 0;
        let done = 0;
        let review = 0;
        list.forEach((t: any) => {
          const st = normalize(t.status);
          if (st === "IN_PROGRESS") inProg += 1;
          else if (st === "DONE") done += 1;
          else if (st === "REVIEW") review += 1;
        });

        setTotalTasks(list.length);
        setInProgressCount(inProg);
        setCompletedCount(done);
        setReviewCount(review);
      } catch (err) {
        // ignore silently
      }
    };
    loadStats();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {getGreeting()}, <span className="text-gradient">{user?.emp_id}</span>
        </h1>
        <p className="text-muted-foreground">{getRoleDescription()}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {(user?.role === "admin" || user?.role === "manager") && (
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <StatsCard
              title="Total Employees"
              value={totalEmployees ?? "—"}
              description="Active team members"
              icon={Users}
              trend={{ value: 12, isPositive: true }}
            />
          </div>
        )}

        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <StatsCard
            title="Active Tasks"
            value={inProgressCount}
            description="In progress"
            icon={ClipboardList}
          />
        </div>

        <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <StatsCard
            title="Completed"
            value={completedCount}
            description="Completed tasks"
            icon={CheckCircle2}
            trend={{
              value: totalTasks
                ? Math.round((completedCount / Math.max(1, totalTasks)) * 100)
                : 0,
              isPositive: true,
            }}
          />
        </div>

        <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <StatsCard
            title="Pending Review"
            value={reviewCount}
            description="Awaiting approval"
            icon={Clock}
          />
        </div>

        {user?.role === "admin" && (
          <>
            <div className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <StatsCard
                title="Total Tasks"
                value={totalTasks}
                description="All tasks"
                icon={TrendingUp}
                trend={{ value: 3, isPositive: true }}
              />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <StatsCard
                title="Overdue"
                value="—"
                description="Needs attention"
                icon={AlertCircle}
              />
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in" style={{ animationDelay: "0.7s" }}>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {user?.role !== "developer" && (
            <button className="gradient-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-all duration-200 group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Create Task</h3>
              <p className="text-sm text-muted-foreground">
                Assign new work items
              </p>
            </button>
          )}

          <button className="gradient-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-medium text-foreground mb-1">View My Tasks</h3>
            <p className="text-sm text-muted-foreground">See assigned items</p>
          </button>

          {user?.role === "admin" && (
            <button className="gradient-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-all duration-200 group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Add Employee</h3>
              <p className="text-sm text-muted-foreground">
                Onboard new team members
              </p>
            </button>
          )}

          <button className="gradient-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-medium text-foreground mb-1">View Reports</h3>
            <p className="text-sm text-muted-foreground">
              Analytics & insights
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
