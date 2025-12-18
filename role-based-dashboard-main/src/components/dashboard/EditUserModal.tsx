import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface User {
  e_id?: number;
  roles?: string[];
  status?: string;
  e_id_str?: string;
}

interface Props {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (user: any) => void;
}

const roleOptions = [
  { label: "Admin", value: "Admin" },
  { label: "Manager", value: "Manager" },
  { label: "Developer", value: "Developer" },
];

const statusOptions = [
  { label: "active", value: "active" },
  { label: "inactive", value: "inactive" },
];

const EditUserModal: React.FC<Props> = ({
  user,
  open,
  onOpenChange,
  onUpdated,
}) => {
  const [role, setRole] = useState<string>("Developer");
  const [status, setStatus] = useState<string>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setRole(
        (user.roles && user.roles.length > 0 && user.roles[0]) || "Developer"
      );
      setStatus(user.status || "active");
    }
  }, [user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.e_id) {
      toast({
        title: "Error",
        description: "User id missing",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        roles: [role],
        status,
      };
      const res = await api.put(`/Users/update?id=${user.e_id}`, payload);
      const updated = res?.user ?? null;
      if (updated) {
        toast({ title: "Updated", description: "User updated successfully" });
        onUpdated(updated);
        onOpenChange(false);
      } else {
        toast({ title: "Updated", description: res?.detail ?? "User updated" });
        onUpdated({
          e_id: user.e_id,
          roles: payload.roles,
          status: payload.status,
        });
        onOpenChange(false);
      }
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err?.message || "Could not update user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => handleSubmit(e)} className="grid gap-4">
          <div>
            <Label>Role</Label>
            <Select onValueChange={(v) => setRole(v)} value={role}>
              <SelectTrigger className="w-[200px] bg-card">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select onValueChange={(v) => setStatus(v)} value={status}>
              <SelectTrigger className="w-[200px] bg-card">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
