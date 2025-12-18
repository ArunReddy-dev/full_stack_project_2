import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import api from "@/lib/api";
import TaskKanbanBoard from "@/components/dashboard/TaskKanbanBoard";
import CreateTaskModal from "@/components/dashboard/CreateTaskModal";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Mock tasks data
const initialTasks: Task[] = [
  {
    t_id: "TASK-001",
    title: "Implement user authentication",
    description:
      "Build JWT-based authentication system with login and registration flows",
    created_by: "mgr001",
    assigned_to: "dev001",
    assigned_by: "mgr001",
    priority: "high",
    status: "IN_PROGRESS",
    reviewer: "mgr001",
    expected_closure: "2024-12-20",
  },
  {
    t_id: "TASK-002",
    title: "Design dashboard layout",
    description:
      "Create responsive dashboard with modern UI components and charts",
    created_by: "admin001",
    assigned_to: "dev002",
    assigned_by: "mgr001",
    priority: "medium",
    status: "DONE",
    reviewer: "mgr001",
    expected_closure: "2024-12-15",
    actual_closure: "2024-12-14",
  },
  {
    t_id: "TASK-003",
    title: "API integration testing",
    description: "Write comprehensive integration tests for all API endpoints",
    created_by: "mgr001",
    assigned_to: "dev001",
    priority: "high",
    status: "TO_DO",
    reviewer: "mgr001",
    expected_closure: "2024-12-25",
  },
  {
    t_id: "TASK-004",
    title: "Documentation update",
    description: "Update API documentation with new endpoints and examples",
    created_by: "mgr001",
    assigned_to: "dev003",
    priority: "low",
    status: "REVIEW",
    reviewer: "mgr001",
    expected_closure: "2024-12-22",
  },
  {
    t_id: "TASK-005",
    title: "Performance optimization",
    description: "Optimize database queries and implement caching strategies",
    created_by: "admin001",
    priority: "medium",
    status: "TO_DO",
    expected_closure: "2024-12-28",
  },
  {
    t_id: "TASK-006",
    title: "Bug fixes for user module",
    description: "Fix reported bugs in user profile and settings pages",
    created_by: "mgr001",
    assigned_to: "dev002",
    priority: "high",
    status: "IN_PROGRESS",
    reviewer: "mgr001",
    expected_closure: "2024-12-19",
  },
];

const TasksPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all"
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const canCreate = user?.role === "admin" || user?.role === "manager";

  // Map frontend role to backend enum (Admin/Manager/Developer)
  const mapRoleToBackend = (r?: string) => {
    if (!r) return "Developer";
    if (r === "admin") return "Admin";
    if (r === "manager") return "Manager";
    return "Developer";
  };

  const handleTaskUpdate = async (taskId: string, newStatus: TaskStatus) => {
    // call backend to patch status
    try {
      const roleParam = mapRoleToBackend(user?.role);
      // backend expects numeric id or id param; assuming frontend t_id matches backend id
      await api.patch(
        `/Task/patch?id=${taskId}&status=${newStatus}&role=${roleParam}`
      );
      setTasks((prev) =>
        prev.map((task) =>
          task.t_id === taskId
            ? {
                ...task,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : task
        )
      );
    } catch (err) {
      console.error("Failed to patch task:", err);
    }
  };

  const handleTaskCreate = async (newTask: Omit<Task, "t_id">) => {
    try {
      const roleParam = mapRoleToBackend(user?.role);
      // Prepare payload for server: map status enum and ensure date/ids are in expected formats
      const mapStatusToBackend = (s: string) => {
        switch (s) {
          case "TO_DO":
            return "to_do";
          case "IN_PROGRESS":
            return "in_progress";
          case "REVIEW":
            return "review";
          case "DONE":
            return "done";
          default:
            return s.toLowerCase();
        }
      };

      const payloadForServer: any = {
        ...newTask,
        status: mapStatusToBackend(newTask.status as string),
        expected_closure: newTask.expected_closure
          ? new Date(newTask.expected_closure).toISOString()
          : undefined,
      };

      // convert assigned ids to numbers when possible
      if (payloadForServer.assigned_to) {
        const n = Number(payloadForServer.assigned_to);
        payloadForServer.assigned_to = Number.isFinite(n)
          ? n
          : payloadForServer.assigned_to;
      }
      if (payloadForServer.assigned_by) {
        const n = Number(payloadForServer.assigned_by);
        payloadForServer.assigned_by = Number.isFinite(n)
          ? n
          : payloadForServer.assigned_by;
      }

      // Use central api helper which handles base URL and Authorization header
      const data = await api.post(
        `/Task/create?role=${roleParam}`,
        payloadForServer
      );
      // backend returns { detail, task }
      // Refresh tasks from server to ensure consistent data (and assigned_to types)
      await fetchTasks();
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const roleParam = mapRoleToBackend(user.role);
      try {
        const data = await api.get(`/Task/getall?role=${roleParam}`);
        const list = Array.isArray(data) ? data : [];
        // Normalize server task shape to frontend Task type
        const normalizeStatusFromBackend = (s: any) => {
          if (!s && s !== 0) return "TO_DO";
          const low = String(s).toLowerCase();
          if (low === "to_do" || low === "todo") return "TO_DO";
          if (low === "in_progress") return "IN_PROGRESS";
          if (low === "review") return "REVIEW";
          if (low === "done") return "DONE";
          return String(s).toUpperCase();
        };

        const normalized = list.map(
          (t: any) =>
            ({
              t_id: String(t.t_id ?? t.id ?? ""),
              title: t.title,
              description: t.description,
              created_by: String(t.created_by ?? ""),
              assigned_to:
                t.assigned_to !== undefined && t.assigned_to !== null
                  ? String(t.assigned_to)
                  : undefined,
              assigned_by:
                t.assigned_by !== undefined && t.assigned_by !== null
                  ? String(t.assigned_by)
                  : undefined,
              priority: t.priority ?? "medium",
              status: normalizeStatusFromBackend(t.status),
              reviewer:
                t.reviewer !== undefined && t.reviewer !== null
                  ? String(t.reviewer)
                  : undefined,
              expected_closure: t.expected_closure,
              actual_closure: t.actual_closure,
              updated_at: t.updated_at,
            } as Task)
        );

        setTasks(normalized);
      } catch (err: any) {
        console.warn("Failed to fetch tasks", err?.status || err);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Filter tasks based on search, priority, and role
  let filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.t_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  // Allow optional ?assignedTo=<id> query param to explicitly filter to an assignee
  const params = new URLSearchParams(location.search);
  const assignedToParam = params.get("assignedTo");
  if (assignedToParam) {
    filteredTasks = filteredTasks.filter(
      (task) => String(task.assigned_to) === String(assignedToParam)
    );
  } else if (user?.role === "developer") {
    // default behaviour for developers: only show tasks assigned to them
    filteredTasks = filteredTasks.filter(
      (task) => String(task.assigned_to) === String(user.emp_id)
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Tasks Board
          </h1>
          <p className="text-muted-foreground text-sm">
            {user?.role === "admin"
              ? "View all tasks (Admin cannot change status)"
              : user?.role === "manager"
              ? "Drag tasks from Review to update status"
              : "Drag your assigned tasks to update status"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Create Task Button */}
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          )}

          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3",
                viewMode === "kanban" && "bg-card shadow-sm"
              )}
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="w-4 h-4 mr-1" />
              Kanban
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3",
                viewMode === "list" && "bg-card shadow-sm"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4 mr-1" />
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9 bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Priority Filter */}
        <Select
          value={priorityFilter}
          onValueChange={(val) =>
            setPriorityFilter(val as TaskPriority | "all")
          }
        >
          <SelectTrigger className="w-[150px] bg-card">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                High
              </span>
            </SelectItem>
            <SelectItem value="medium">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Medium
              </span>
            </SelectItem>
            <SelectItem value="low">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Low
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "kanban" ? (
          <TaskKanbanBoard
            tasks={filteredTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskModified={() => fetchTasks()}
          />
        ) : (
          <div className="text-muted-foreground text-center py-12">
            List view coming soon...
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        // pass a refresh callback so modal will trigger a reload after successful create
        onTaskCreate={() => fetchTasks()}
      />
    </div>
  );
};

export default TasksPage;
