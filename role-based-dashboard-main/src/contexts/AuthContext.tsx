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

    const frontendRole =
      Array.isArray(backendUser.roles) && backendUser.roles.length > 0
        ? mapBackendRoleToFrontend(backendUser.roles[0])
        : "developer";

    const loggedInUser: User = {
      emp_id: backendUser.e_id,
      role: frontendRole as User["role"],
      token: accessToken,
    };

    setUser(loggedInUser);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
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
