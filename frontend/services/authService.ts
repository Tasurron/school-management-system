import axiosInstance from "./axiosInstance";
import { AuthUser, User } from "@/types/user";

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await axiosInstance.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return response.data;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  role: "Admin" | "Teacher" | "Student";
  classId?: number | null;
}

export async function register(input: RegisterInput): Promise<LoginResponse> {
  const response = await axiosInstance.post<LoginResponse>("/auth/register", input);
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await axiosInstance.get<User>("/auth/me");
  return response.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await axiosInstance.post("/auth/forgot-password", { email });
}

export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<void> {
  await axiosInstance.post("/auth/reset-password", { email, otp, newPassword });
}

export interface UpdateMeInput {
  fullName: string;
  newPassword?: string;
}

export async function updateMe(input: UpdateMeInput): Promise<User> {
  const response = await axiosInstance.put<User>("/auth/me", input);
  return response.data;
}
