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
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Employee {
  e_id?: number;
  name?: string;
  email?: string;
  designation?: string;
  mgr_id?: number;
}

interface Props {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (employee: any) => void;
}

const EditEmployeeModal: React.FC<Props> = ({
  employee,
  open,
  onOpenChange,
  onUpdated,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [mgrId, setMgrId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      setName(employee.name ?? "");
      setEmail(employee.email ?? "");
      setDesignation(employee.designation ?? "");
      setMgrId(employee.mgr_id ? String(employee.mgr_id) : "");
    }
  }, [employee]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!employee?.e_id) {
      toast({
        title: "Error",
        description: "Employee id is missing",
        variant: "destructive",
      });
      return;
    }
    if (!name.trim() || !email.trim() || !designation.trim() || !mgrId.trim()) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        designation: designation.trim(),
        mgr_id: Number(mgrId),
      };
      const res = await api.put(
        `/Employee/update?id=${employee.e_id}`,
        payload
      );
      const updated = res?.employee ?? null;
      if (updated) {
        toast({
          title: "Updated",
          description: "Employee updated successfully",
        });
        onUpdated(updated);
        onOpenChange(false);
      } else {
        toast({
          title: "Updated",
          description: res?.detail ?? "Employee updated",
        });
        onUpdated({ e_id: employee.e_id, ...payload });
        onOpenChange(false);
      }
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err?.message || "Could not update employee",
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
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => handleSubmit(e)} className="grid gap-4">
          <div>
            <Label htmlFor="edit-emp-name">Name</Label>
            <Input
              id="edit-emp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-emp-email">Email</Label>
            <Input
              id="edit-emp-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-emp-designation">Designation</Label>
            <Input
              id="edit-emp-designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-emp-mgrid">Manager ID</Label>
            <Input
              id="edit-emp-mgrid"
              value={mgrId}
              onChange={(e) => setMgrId(e.target.value)}
              type="number"
            />
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

export default EditEmployeeModal;
