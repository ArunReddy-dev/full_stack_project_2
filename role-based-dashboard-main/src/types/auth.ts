export type UserRole = 'admin' | 'manager' | 'developer';

export interface User {
  emp_id: string;
  role: UserRole;
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
