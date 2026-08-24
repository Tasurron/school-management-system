import axiosInstance from "./axiosInstance";
import { ClassInput, SchoolClass } from "@/types/class";

export async function getClasses(): Promise<SchoolClass[]> {
  const response = await axiosInstance.get<SchoolClass[]>("/classes");
  return response.data;
}

export async function createClass(input: ClassInput): Promise<SchoolClass> {
  const response = await axiosInstance.post<SchoolClass>("/classes", input);
  return response.data;
}

export async function updateClass(id: number, input: ClassInput): Promise<SchoolClass> {
  const response = await axiosInstance.put<SchoolClass>(`/classes/${id}`, input);
  return response.data;
}

export async function deleteClass(id: number): Promise<void> {
  await axiosInstance.delete(`/classes/${id}`);
}
