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
};

export default function CreateTaskModal({
  open,
  onOpenChange,
  onCreated,
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadLists = async () => {
      try {
        // Load developers (employees with designation Developer)
        const devsRes = await api.get(`/Employee/getall?designation=Developer`);
        setDevelopers(devsRes || []);

        // Load users then filter managers
        const usersRes = await api.get(`/Users/getall`);
        const mgrs = (usersRes || []).filter(
          (u: any) => u.role?.toLowerCase() === "manager"
        );
        setManagers(mgrs);
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
      const payload: any = {
        title,
        description: desc,
        priority,
        due_date: dueDate || undefined,
      };

      // Normalize assigned_to/reviewer fields to numeric ids when possible
      if (assignTo) {
        payload.assigned_to =
          typeof assignTo === "string" ? parseInt(assignTo, 10) : assignTo;
      }
      if (reviewer) {
        payload.reviewer =
          typeof reviewer === "string" ? parseInt(reviewer, 10) : reviewer;
      }

      // created_by should be current user id if available
      if (user?.id) payload.created_by = user.id;

      // Role param expected by backend
      const roleParam = user?.role
        ? `?role=${encodeURIComponent(user.role)}`
        : "";

      const res = await api.post(`/Task/create${roleParam}`, payload);

      toast({ title: "Created", description: "Task created successfully" });
      reset();
      onOpenChange(false);
      if (onCreated) onCreated(res);
    } catch (err: any) {
      toast({
        title: "Create Failed",
        description:
          err?.data?.detail || err?.message || "Could not create task",
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
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name || m.email || `Mgr ${m.id}`}
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
