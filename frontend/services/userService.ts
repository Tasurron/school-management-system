import axiosInstance from "./axiosInstance";
import { CreateUserInput, UpdateUserInput, User } from "@/types/user";

export async function getUsers(): Promise<User[]> {
  const response = await axiosInstance.get<User[]>("/users");
  return response.data;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const response = await axiosInstance.post<User>("/users", input);
  return response.data;
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<User> {
  const response = await axiosInstance.put<User>(`/users/${id}`, input);
  return response.data;
}

export async function deactivateUser(id: number): Promise<void> {
  await axiosInstance.put(`/users/${id}/deactivate`);
}
