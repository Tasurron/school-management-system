import axiosInstance from "./axiosInstance";
import { TeacherAssignment, TeacherAssignmentInput } from "@/types/teacherAssignment";

export async function getTeacherAssignments(): Promise<TeacherAssignment[]> {
  const response = await axiosInstance.get<TeacherAssignment[]>("/teacher-assignments");
  return response.data;
}

export async function createTeacherAssignment(
  input: TeacherAssignmentInput
): Promise<TeacherAssignment> {
  const response = await axiosInstance.post<TeacherAssignment>("/teacher-assignments", input);
  return response.data;
}

export async function deleteTeacherAssignment(id: number): Promise<void> {
  await axiosInstance.delete(`/teacher-assignments/${id}`);
}
