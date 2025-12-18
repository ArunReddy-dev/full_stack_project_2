import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
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

interface Props {
  onCreated: (employee: any) => void;
}

const CreateEmployeeModal: React.FC<Props> = ({ onCreated }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [mgrId, setMgrId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setName("");
    setEmail("");
    setDesignation("");
    setMgrId("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim() || !email.trim() || !designation.trim() || !mgrId.trim()) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }
    // basic email check for backend domain
    if (!email.endsWith("@ust.com")) {
      toast({
        title: "Validation Error",
        description: "Email must end with @ust.com",
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

      const res = await api.post("/Employee/create", payload);
      // backend returns { detail, employee }
      const newEmp = res?.employee ?? null;
      if (newEmp) {
        toast({
          title: "Employee Created",
          description: "Employee was added successfully",
        });
        onCreated(newEmp);
        reset();
        setOpen(false);
      } else {
        toast({
          title: "Created",
          description: res?.detail ?? "Employee created",
        });
        // still attempt to refresh by informing parent with returned payload
        onCreated(payload as any);
        reset();
        setOpen(false);
      }
    } catch (err: any) {
      toast({
        title: "Create Failed",
        description: err?.message || "Could not create employee",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glow">Add Employee</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => handleSubmit(e)} className="grid gap-4">
          <div>
            <Label htmlFor="emp-name">Name</Label>
            <Input
              id="emp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="emp-email">Email</Label>
            <Input
              id="emp-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@ust.com"
            />
          </div>
          <div>
            <Label htmlFor="emp-designation">Designation</Label>
            <Input
              id="emp-designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="emp-mgrid">Manager ID</Label>
            <Input
              id="emp-mgrid"
              value={mgrId}
              onChange={(e) => setMgrId(e.target.value)}
              type="number"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEmployeeModal;
