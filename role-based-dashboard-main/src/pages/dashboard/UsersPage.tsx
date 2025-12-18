import { Button } from "@/components/ui/button";
import { Search, Filter, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import EditUserModal from "@/components/dashboard/EditUserModal";
import { useToast } from "@/hooks/use-toast";

type UserItem = {
  e_id?: number;
  password?: string | null;
  roles: string[];
  status: string;
};

const UsersPage = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Users/getall");
      setUsers(Array.isArray(res) ? res : []);
    } catch (err: any) {
      if (err?.status === 404) setUsers([]);
      else
        toast({
          title: "Error",
          description: err?.message || "Failed to load users",
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleEditClick = (u: any) => {
    setEditingUser(u);
    setEditOpen(true);
  };

  const handleUpdated = (updated: any) => {
    setUsers((prev) =>
      prev.map((u) => (u.e_id === updated.e_id ? updated : u))
    );
  };

  const handleDelete = async (u: any) => {
    if (!u?.e_id) {
      toast({
        title: "Delete Failed",
        description: "User id missing",
        variant: "destructive",
      });
      return;
    }
    const confirmed = window.confirm(`Delete user ${u.e_id}?`);
    if (!confirmed) return;
    try {
      await api.del(`/Users/delete?id=${u.e_id}`);
      setUsers((prev) => prev.filter((x) => x.e_id !== u.e_id));
      toast({ title: "Deleted", description: "User removed" });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err?.message || "Could not delete user",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-destructive/20 text-destructive";
      case "manager":
        return "bg-warning/20 text-warning";
      case "developer":
        return "bg-success/20 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        {/* Removed Add User button - page reflects DB users */}
        <div />
      </div>

      {/* Filters */}
      <div
        className="flex gap-4 mb-6 animate-fade-in"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-10" />
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
                Employee ID
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                Role
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                Status
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-4">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.e_id}
                  className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {u.e_id}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(
                        u.roles?.[0] ?? ""
                      )}`}
                    >
                      {u.roles?.[0] ?? "-"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        u.status === "active"
                          ? "bg-success/20 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(u)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(u)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EditUserModal
        user={editingUser}
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEditingUser(null);
        }}
        onUpdated={handleUpdated}
      />
    </div>
  );
};

export default UsersPage;
