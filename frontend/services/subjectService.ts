import axiosInstance from "./axiosInstance";
import { Subject, SubjectInput } from "@/types/subject";

export async function getSubjects(): Promise<Subject[]> {
  const response = await axiosInstance.get<Subject[]>("/subjects");
  return response.data;
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  const response = await axiosInstance.post<Subject>("/subjects", input);
  return response.data;
}

export async function updateSubject(id: number, input: SubjectInput): Promise<Subject> {
  const response = await axiosInstance.put<Subject>(`/subjects/${id}`, input);
  return response.data;
}

export async function deleteSubject(id: number): Promise<void> {
  await axiosInstance.delete(`/subjects/${id}`);
}
