import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
// reviewer will be a simple input (manager id) so no Select import needed
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { CalendarIcon } from "lucide-react";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // callback to notify parent after a successful create (no payload)
  onTaskCreate: () => void;
}

const CreateTaskModal = ({
  open,
  onOpenChange,
  onTaskCreate,
}: CreateTaskModalProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [expectedClosure, setExpectedClosure] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Employees will be loaded from backend
  const [employees, setEmployees] = useState<
    { emp_id: string | number; name: string }[]
  >([]);
  const [managers, setManagers] = useState<
    { emp_id: string | number; name: string }[]
  >([]);

  useEffect(() => {
    let mounted = true;

    const loadEmployees = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
          }/Employee/getall`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const list = Array.isArray(data)
          ? data.map((e: any) => ({ emp_id: e.e_id, name: e.name }))
          : [];
        setEmployees(list);
      } catch (err) {
        // ignore silently
      }
    };

    const loadManagers = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
          }/Users/getall`,
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const mgrs = Array.isArray(data)
          ? data
              .filter(
                (u: any) =>
                  Array.isArray(u.roles) && u.roles.includes("Manager")
              )
              .map((u: any) => ({ emp_id: u.e_id, name: String(u.e_id) }))
          : [];
        setManagers(mgrs);
      } catch (err) {
        // ignore
      }
    };

    loadEmployees();
    loadManagers();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !expectedClosure) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // validate date
      if (Number.isNaN(Date.parse(expectedClosure))) {
        toast.error("Please provide a valid expected closure date");
        setIsSubmitting(false);
        return;
      }

      // Resolve assigned employee: prefer validating against backend GET /Employee/get?id=...
      let finalAssignedTo = String(user?.emp_id ?? "");
      if (assignedTo && String(assignedTo).trim()) {
        const trimmed = String(assignedTo).trim();
        let foundEmp: any = null;

        // First try direct numeric id lookup
        if (/^\d+$/.test(trimmed)) {
          try {
            const emp = await api.get(`/Employee/get?id=${trimmed}`);
            if (emp && (emp as any).e_id !== undefined) {
              foundEmp = emp;
            }
          } catch (err) {
            // ignore here, will fallback to scanning all employees
          }
        }

        // If not found by id, try searching employees by name or email (case-insensitive)
        if (!foundEmp) {
          try {
            const emps: any = await api.get("/Employee/getall");
            if (Array.isArray(emps)) {
              const lowered = trimmed.toLowerCase();
              foundEmp = emps.find((e: any) => {
                return (
                  String(e.e_id) === trimmed ||
                  (e.name && String(e.name).toLowerCase() === lowered) ||
                  (e.email && String(e.email).toLowerCase() === lowered) ||
                  (e.name && String(e.name).toLowerCase().includes(lowered)) ||
                  (e.email && String(e.email).toLowerCase().includes(lowered))
                );
              });
            }
          } catch (err) {
            // ignore and fallback
          }
        }

        if (foundEmp && (foundEmp as any).e_id !== undefined) {
          finalAssignedTo = String((foundEmp as any).e_id);
          toast.success(`Assigning to ${foundEmp.name} (${foundEmp.e_id})`);
        } else {
          toast.info("Employee not found; assigning to you instead");
          finalAssignedTo = String(user?.emp_id ?? "");
        }
      }

      const newTask: Omit<Task, "t_id"> = {
        title: title.trim(),
        description: description.trim(),
        created_by: String(user?.emp_id ?? ""),
        priority,
        status: "TO_DO" as TaskStatus,
        expected_closure: new Date(expectedClosure).toISOString(),
        assigned_to: finalAssignedTo,
        assigned_by: String(user?.emp_id ?? ""),
        assigned_at: new Date().toISOString(),
        ...(reviewer && { reviewer }),
      };

      // prepare payload for server: map status and convert ids to numbers when possible
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
        expected_closure: newTask.expected_closure,
      };

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
      if (payloadForServer.reviewer) {
        const n = Number(payloadForServer.reviewer);
        payloadForServer.reviewer = Number.isFinite(n)
          ? n
          : payloadForServer.reviewer;
      }

      try {
        const mapRoleToBackend = (r?: string) => {
          if (!r) return "Developer";
          if (r === "admin") return "Admin";
          if (r === "manager") return "Manager";
          return "Developer";
        };

        const roleParam = mapRoleToBackend(user?.role);
        const resp = await api.post(
          `/Task/create?role=${roleParam}`,
          payloadForServer
        );
        toast.success("Task created successfully!");
        // notify parent so it can refresh the tasks list
        onTaskCreate();

        // Reset form
        setTitle("");
        setDescription("");
        setPriority("medium");
        setAssignedTo("");
        setReviewer("");
        setExpectedClosure("");
        onOpenChange(false);
      } catch (err: any) {
        const msg =
          err?.data?.detail || err?.message || "Failed to create task";
        toast.error(String(msg));
      }
    } catch (error) {
      toast.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="bg-background"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
              className="bg-background resize-none"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>
              Priority <span className="text-destructive">*</span>
            </Label>
            <Select
              value={priority}
              onValueChange={(val) => setPriority(val as TaskPriority)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
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

          {/* Assign To */}
          <div className="space-y-2">
            <Label htmlFor="assign-to">Assign To (Employee ID)</Label>
            <Input
              id="assign-to"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Enter employee id (e.g. 123) - optional"
              className="bg-background"
            />
            {assignedTo ? (
              <p className="text-sm mt-1">
                {employees.find(
                  (emp) => String(emp.emp_id) === String(assignedTo)
                ) ? (
                  <span className="text-muted-foreground">
                    Assigning to:{" "}
                    {
                      employees.find(
                        (emp) => String(emp.emp_id) === String(assignedTo)
                      )!.name
                    }{" "}
                    ({assignedTo})
                  </span>
                ) : (
                  <span className="text-destructive">
                    Employee ID not found in directory — task will still be
                    created but may not be assigned correctly.
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm mt-1 text-muted-foreground">
                Leave empty to assign to yourself
              </p>
            )}
          </div>

          {/* Reviewer */}
          <div className="space-y-2">
            <Label htmlFor="reviewer">Reviewer (Manager ID)</Label>
            <Input
              id="reviewer"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              placeholder="Enter manager id (e.g. 123) - optional"
              className="bg-background"
            />
            {reviewer ? (
              <p className="text-sm mt-1">
                {managers.find((m) => String(m.emp_id) === String(reviewer)) ? (
                  <span className="text-muted-foreground">
                    Reviewer set to:{" "}
                    {
                      managers.find(
                        (m) => String(m.emp_id) === String(reviewer)
                      )!.name
                    }{" "}
                    ({reviewer})
                  </span>
                ) : (
                  <span className="text-destructive">
                    Manager ID not found — the task will still be created but
                    may not appear in a manager's review list if the id is
                    invalid.
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm mt-1 text-muted-foreground">
                Optional. Enter manager's employee id to route this task to
                their review list.
              </p>
            )}
          </div>

          {/* Expected Closure Date */}
          <div className="space-y-2">
            <Label htmlFor="expectedClosure">
              Expected Closure <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="expectedClosure"
                type="date"
                value={expectedClosure}
                onChange={(e) => setExpectedClosure(e.target.value)}
                className="bg-background"
                min={new Date().toISOString().split("T")[0]}
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal;
