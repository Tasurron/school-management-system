// Role string exactly as returned by the backend.
export type Role = "Admin" | "Teacher" | "Student";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  classId: number | null;
  className?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

// Shape stored in localStorage after login (subset returned by /auth/login).
export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  classId: number | null;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  classId?: number | null;
}

export interface UpdateUserInput {
  fullName: string;
  email: string;
  classId?: number | null;
}
