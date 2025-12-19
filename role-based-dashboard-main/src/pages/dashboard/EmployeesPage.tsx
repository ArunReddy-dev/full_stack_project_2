import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import CreateEmployeeModal from "@/components/dashboard/CreateEmployeeModal";
import EditEmployeeModal from "@/components/dashboard/EditEmployeeModal";
import { useToast } from "@/hooks/use-toast";

type Employee = {
  e_id?: number;
  name: string;
  email: string;
  designation?: string;
  mgr_id?: number;
  status?: string;
};

const EmployeesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      // If manager, fetch only employees who report to this manager
      let path = "/Employee/getall";
      if (user?.role === "manager") {
        path += `?mgr_id=${user.emp_id}`;
      }
      const res = await api.get(path);
      // backend returns list - if 404 thrown, we'll fall to catch
      setEmployees(Array.isArray(res) ? res : []);
    } catch (err: any) {
      // If backend returns 404 for empty, set empty list
      if (err?.status === 404) {
        setEmployees([]);
      } else {
        toast({
          title: "Error",
          description: err?.message || "Failed to load employees",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreated = (newEmp: any) => {
    // normalize returned employee keys: backend uses e_id, etc.
    setEmployees((prev) => [newEmp, ...prev]);
  };

  const [editingEmp, setEditingEmp] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleEditClick = (emp: any) => {
    setEditingEmp(emp);
    setEditOpen(true);
  };

  const handleUpdated = (updatedEmp: any) => {
    setEmployees((prev) =>
      prev.map((e) => (e.e_id === updatedEmp.e_id ? updatedEmp : e))
    );
  };

  const handleDelete = async (emp: any) => {
    if (!emp?.e_id) {
      toast({
        title: "Delete Failed",
        description: "Employee id missing",
        variant: "destructive",
      });
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to delete ${emp.name || emp.email}?`
    );
    if (!confirmed) return;
    try {
      await api.del(`/Employee/delete?id=${emp.e_id}`);
      setEmployees((prev) => prev.filter((e) => e.e_id !== emp.e_id));
      toast({ title: "Deleted", description: "Employee removed" });
    } catch (err: any) {
      // Format possible validation errors into a readable string
      const detail = err?.data?.detail || err?.data || err?.message || err;
      let msg = "Could not delete employee";
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
        title: "Delete Failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Employees</h1>
          <p className="text-muted-foreground">
            Manage employee records and information
          </p>
        </div>
        {isAdmin ? <CreateEmployeeModal onCreated={handleCreated} /> : <div />}
      </div>

      {/* Filters */}
      <div
        className="flex gap-4 mb-6 animate-fade-in"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search employees..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Table */}
      <div
        className="gradient-card border border-border rounded-xl overflow-hidden animate-fade-in"
        style={{ animationDelay: "0.2s" }}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                Name
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                Email
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                Designation
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                Manager ID
              </th>
              {isAdmin && (
                <th className="text-left p-4 text-sm font-semibold text-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4" colSpan={isAdmin ? 5 : 4}>
                  Loading...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-muted-foreground"
                  colSpan={isAdmin ? 5 : 4}
                >
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr
                  key={employee.e_id ?? employee.email}
                  className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {employee.name
                            ? employee.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                            : ""}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">
                        {employee.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {employee.email}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {employee.designation ?? "-"}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {employee.mgr_id ?? "-"}
                  </td>
                  {isAdmin && (
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(employee)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(employee)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {isAdmin && (
        <EditEmployeeModal
          employee={editingEmp}
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setEditingEmp(null);
          }}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
};

export default EmployeesPage;
