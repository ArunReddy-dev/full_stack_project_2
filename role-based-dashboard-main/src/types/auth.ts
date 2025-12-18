export type UserRole = "admin" | "manager" | "developer";

export interface User {
  emp_id: string;
  // active role the user is currently viewing as
  role: UserRole;
  // all roles assigned to the user (backend roles mapped to lowercase)
  roles?: UserRole[];
  // human-friendly name if available
  name?: string;
  token: string;
}

export interface LoginCredentials {
  emp_id: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface AuthContextType {
  // Note: switchRole allows changing the active role (e.g. admin -> manager)
  switchRole?: (role: User["role"]) => void;
}
