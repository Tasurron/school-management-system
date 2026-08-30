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

function toFormData(input: AssignmentInput): FormData {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("description", input.description);
  formData.append("deadline", input.deadline);
  formData.append("maxMarks", String(input.maxMarks));
  formData.append("classGrade", String(input.classGrade));
  formData.append("classSection", input.classSection);
  formData.append("subjectId", String(input.subjectId));
  if (input.status) formData.append("status", input.status);
  if (input.attachment) formData.append("attachment", input.attachment);
  if (input.removeAttachment) formData.append("removeAttachment", "true");
  return formData;
}

export async function createAssignment(input: AssignmentInput): Promise<Assignment> {
  const response = await axiosInstance.post<Assignment>("/assignments", toFormData(input), {
    // Let the browser set the multipart Content-Type (it needs to add its own
    // boundary parameter) - override the axios instance's default JSON header.
    headers: { "Content-Type": undefined },
  });
  return response.data;
}

export async function updateAssignment(id: number, input: AssignmentInput): Promise<Assignment> {
  const response = await axiosInstance.put<Assignment>(`/assignments/${id}`, toFormData(input), {
    // Let the browser set the multipart Content-Type (it needs to add its own
    // boundary parameter) - override the axios instance's default JSON header.
    headers: { "Content-Type": undefined },
  });
  return response.data;
}

export async function deleteAssignment(id: number): Promise<void> {
  await axiosInstance.delete(`/assignments/${id}`);
}

// Downloads the attachment as a blob (the JWT is only sent via the axios
// interceptor, so a plain <a href> can't be used for a protected file).
export async function downloadAttachment(id: number, fileName: string): Promise<void> {
  const response = await axiosInstance.get(`/assignments/${id}/attachment`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
