import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, LoginCredentials, AuthContextType } from "@/types/auth";
import api from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map backend roles (e.g. "Admin") to frontend role keys (lowercase)
const mapBackendRoleToFrontend = (role: string) =>
  role?.toLowerCase() || "developer";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    // Call backend /auth/login - backend expects e_id and password
    const payload = {
      e_id: credentials.emp_id,
      password: credentials.password,
    };
    const data = await api.post("/auth/login", payload);

    // backend returns { access_token, token_type, user: { e_id, roles, status } }
    const accessToken = data.access_token as string;
    const backendUser = data.user as any;

    // map backend roles array to frontend lowercase roles
    const mappedRoles: string[] = Array.isArray(backendUser.roles)
      ? backendUser.roles.map((r: string) => (r || "").toLowerCase())
      : ["developer"];

    const active =
      mappedRoles.length > 0 ? (mappedRoles[0] as User["role"]) : "developer";

    const loggedInUser: User = {
      emp_id: backendUser.e_id,
      role: active,
      roles: mappedRoles as User["roles"],
      token: accessToken,
    };

    setUser(loggedInUser);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    // Try to fetch employee details (name) so UI can greet by name
    try {
      const emp = await api.get(`/Employee/get?id=${backendUser.e_id}`);
      const name = emp?.name || emp?.full_name || null;
      if (name) {
        const updated: User = { ...loggedInUser, name };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      }
    } catch (err) {
      // ignore if employee info not available
    }
  };

  const switchRole = (newRole: User["role"]) => {
    if (!user) return;
    const updated: User = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, switchRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
