import axiosInstance from "./axiosInstance";
import { Assignment, AssignmentInput } from "@/types/assignment";

export async function getAssignments(): Promise<Assignment[]> {
  const response = await axiosInstance.get<Assignment[]>("/assignments");
  return response.data;
}

export async function getAssignmentById(id: number): Promise<Assignment> {
  const assignments = await getAssignments();
  const found = assignments.find((a) => a.id === id);
  if (!found) {
    throw new Error("Assignment not found");
  }
  return found;
}

export async function createAssignment(input: AssignmentInput): Promise<Assignment> {
  const response = await axiosInstance.post<Assignment>("/assignments", input);
  return response.data;
}

export async function updateAssignment(id: number, input: AssignmentInput): Promise<Assignment> {
  const response = await axiosInstance.put<Assignment>(`/assignments/${id}`, input);
  return response.data;
}

export async function deleteAssignment(id: number): Promise<void> {
  await axiosInstance.delete(`/assignments/${id}`);
}
