import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { PieChart as PieChartIcon, ClipboardList } from "lucide-react";

const ReportsPage = () => {
  const [tasksByStatusData, setTasksByStatusData] = useState<any[]>([]);
  const [tasksByPriorityData, setTasksByPriorityData] = useState<any[]>([]);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [selectedRole, setSelectedRole] = useState<
    "Developer" | "Manager" | "Admin"
  >("Developer");

  const fillStatus = {
    TO_DO: "hsl(210, 100%, 60%)",
    IN_PROGRESS: "hsl(45, 100%, 50%)",
    REVIEW: "hsl(30, 100%, 50%)",
    DONE: "hsl(142, 70%, 45%)",
  } as Record<string, string>;

  const normalizeStatus = (s: any) => {
    if (!s && s !== 0) return "TO_DO";
    const low = String(s).toLowerCase();
    if (low.includes("to_do") || low === "to_do" || low === "todo")
      return "TO_DO";
    if (low.includes("in_progress") || low === "in_progress")
      return "IN_PROGRESS";
    if (low.includes("review") || low === "review") return "REVIEW";
    if (low.includes("done") || low === "done") return "DONE";
    return String(s).toUpperCase();
  };

  const normalizePriority = (p: any) => {
    if (!p && p !== 0) return "medium";
    return String(p).toLowerCase();
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // fetch tasks for the currently selected role
        const tasks: any = await api.get(`/Task/getall?role=${selectedRole}`);
        const list = Array.isArray(tasks) ? tasks : [];
        if (!mounted) return;

        const statusCounts: Record<string, number> = {};
        const priorityCounts: Record<string, number> = {};
        list.forEach((t: any) => {
          const st = normalizeStatus(t.status);
          statusCounts[st] = (statusCounts[st] || 0) + 1;
          const pr = normalizePriority(t.priority);
          priorityCounts[pr] = (priorityCounts[pr] || 0) + 1;
        });

        const statusArray = Object.keys(statusCounts).map((k) => ({
          name:
            k === "TO_DO"
              ? "To Do"
              : k === "IN_PROGRESS"
              ? "In Progress"
              : k === "REVIEW"
              ? "Review"
              : "Done",
          value: statusCounts[k],
          fill: fillStatus[k] || "#8884d8",
        }));

        const priorityOrder = ["high", "medium", "low"];
        const priorityArray = priorityOrder.map((p) => ({
          priority: p.charAt(0).toUpperCase() + p.slice(1),
          count: priorityCounts[p] || 0,
          fill:
            p === "high"
              ? "hsl(0, 80%, 55%)"
              : p === "medium"
              ? "hsl(45, 100%, 50%)"
              : "hsl(142, 70%, 45%)",
        }));

        setTasksByStatusData(statusArray);
        setTasksByPriorityData(priorityArray);
        setTotalTasks(list.length);
      } catch (err) {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [selectedRole]);

  const completionRate = totalTasks
    ? Math.round(
        ((tasksByStatusData.find((s) => s.name === "Done")?.value || 0) /
          totalTasks) *
          100
      )
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground text-sm">
          Task summary and performance metrics
        </p>
      </div>

      {/* Summary Cards: keep only top-level summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-3xl font-bold text-foreground">
                  {totalTasks}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-36 text-right text-xs text-muted-foreground">
                  Viewing role
                </div>
                <div className="inline-flex items-center gap-2">
                  {(["Developer", "Manager", "Admin"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRole(r)}
                      className={`px-3 py-1 rounded text-sm font-medium border ${
                        selectedRole === r
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold text-foreground">
                  {completionRate}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <PieChartIcon className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Only two charts: Tasks by Status and Tasks by Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Tasks by Status — {selectedRole}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksByStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {tasksByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Tasks by Priority — {selectedRole}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByPriorityData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="priority"
                    stroke="hsl(var(--muted-foreground))"
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {tasksByPriorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
