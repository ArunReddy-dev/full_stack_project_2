import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import api from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "../../hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (task: any) => void;
  // legacy/alternate prop name used by some pages
  onTaskCreate?: () => void;
};

export default function CreateTaskModal({
  open,
  onOpenChange,
  onCreated,
  onTaskCreate,
}: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignTo, setAssignTo] = useState<string | number | null>(null);
  const [reviewer, setReviewer] = useState<string | number | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [employeeNames, setEmployeeNames] = useState<
    Record<string | number, string>
  >({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadLists = async () => {
      try {
        // Load developers (employees with designation Developer)
        // If logged-in user is a manager, request only their direct reports
        const isManager = (user?.role || "").toLowerCase() === "manager";
        const mgrParam =
          isManager && user?.emp_id
            ? `&mgr_id=${encodeURIComponent(user.emp_id)}`
            : "";
        const devsRes = await api.get(
          `/Employee/getall?designation=Developer${mgrParam}`
        );
        setDevelopers(devsRes || []);

        // Load users then filter managers and show manager id in label
        const usersRes = await api.get(`/Users/getall`);
        const mgrs = (usersRes || []).filter((u: any) => {
          if (Array.isArray(u.roles))
            return u.roles.some(
              (r: string) => (r || "").toLowerCase() === "manager"
            );
          return (u.role || "").toLowerCase() === "manager";
        });
        setManagers(mgrs);

        // Load all employees once to map e_id -> name so reviewer labels can show manager names
        try {
          const allEmps = await api.get(`/Employee/getall`);
          const map: Record<string | number, string> = {};
          (allEmps || []).forEach((emp: any) => {
            map[emp.e_id] = emp.name || String(emp.e_id);
          });
          setEmployeeNames(map);
        } catch (e) {
          // ignore if employee name mapping fails
        }
      } catch (e: any) {
        toast({
          title: "Load failed",
          description: "Could not load users or employees",
        });
      }
    };

    loadLists();
  }, [open]);

  const reset = () => {
    setTitle("");
    setDesc("");
    setPriority("Medium");
    setAssignTo(null);
    setReviewer(null);
    setDueDate(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Client-side validation to avoid backend 422s
      if (!title || title.trim().length === 0) {
        toast({
          title: "Validation",
          description: "Title is required",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (!desc || desc.trim().length === 0) {
        toast({
          title: "Validation",
          description: "Description is required",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (!dueDate) {
        toast({
          title: "Validation",
          description: "Due date is required",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (title.length > 100) {
        toast({
          title: "Validation",
          description: "Title exceeds 100 characters",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (desc.length > 250) {
        toast({
          title: "Validation",
          description: "Description exceeds 250 characters",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const payload: any = {
        title,
        description: desc,
        // backend expects priority in lowercase: high/medium/low
        priority: (priority || "medium").toString().toLowerCase(),
        // backend expects expected_closure (datetime)
        expected_closure: dueDate ? new Date(dueDate).toISOString() : undefined,
      };

      // Normalize assigned_to/reviewer fields to numeric ids when possible
      if (assignTo) {
        payload.assigned_to =
          typeof assignTo === "string" ? parseInt(assignTo, 10) : assignTo;
        // set assigned_by to current user (manager/admin creating the task)
        if (user?.emp_id) payload.assigned_by = user.emp_id;
      }
      if (reviewer) {
        payload.reviewer =
          typeof reviewer === "string" ? parseInt(reviewer, 10) : reviewer;
      }

      // created_by should be current user emp_id if available
      if (user?.emp_id) payload.created_by = user.emp_id;

      // Role param expected by backend (capitalize first letter: manager -> Manager)
      const capitalize = (s: string) =>
        s && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
      const roleParam = user?.role
        ? `?role=${encodeURIComponent(capitalize(String(user.role)))}`
        : "";

      const res = await api.post(`/Task/create${roleParam}`, payload);

      toast({ title: "Created", description: "Task created successfully" });
      reset();
      onOpenChange(false);
      if (onCreated) onCreated(res);
      if (onTaskCreate) onTaskCreate();
    } catch (err: any) {
      // Format validation errors (FastAPI/Pydantic returns an array of error objects)
      let msg = "Could not create task";
      const detail = err?.data?.detail || err?.data || err?.message || err;
      if (Array.isArray(detail)) {
        msg = detail
          .map(
            (d: any) => d.msg || (typeof d === "string" ? d : JSON.stringify(d))
          )
          .join("; ");
      } else if (typeof detail === "object") {
        try {
          msg = JSON.stringify(detail);
        } catch {
          msg = String(detail);
        }
      } else {
        msg = String(detail);
      }

      toast({
        title: "Create Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[700px]">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Priority</label>
            <Select onValueChange={(val) => setPriority(val)}>
              <SelectTrigger>
                <SelectValue placeholder={priority} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <label className="text-sm">Description</label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Assign To</label>
            <Select onValueChange={(val) => setAssignTo(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select developer" />
              </SelectTrigger>
              <SelectContent>
                {developers.map((d) => (
                  <SelectItem key={d.e_id} value={String(d.e_id)}>
                    {d.name || d.email || `Dev ${d.e_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm">Reviewer</label>
            <Select onValueChange={(val) => setReviewer(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((m) => (
                  <SelectItem key={m.e_id} value={String(m.e_id)}>
                    {employeeNames[m.e_id]
                      ? `${employeeNames[m.e_id]} (${m.e_id})`
                      : `Mgr ${m.e_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm">Due Date</label>
            <Input
              type="date"
              value={dueDate || ""}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
