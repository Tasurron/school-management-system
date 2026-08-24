import axiosInstance from "./axiosInstance";
import {
  CreateSubmissionInput,
  GradeSubmissionInput,
  Submission,
  UpdateSubmissionInput,
} from "@/types/submission";

export async function getSubmissions(): Promise<Submission[]> {
  const response = await axiosInstance.get<Submission[]>("/submissions");
  return response.data;
}

export async function getSubmissionById(id: number): Promise<Submission> {
  const submissions = await getSubmissions();
  const found = submissions.find((s) => s.id === id);
  if (!found) {
    throw new Error("Submission not found");
  }
  return found;
}

export async function createSubmission(input: CreateSubmissionInput): Promise<Submission> {
  const response = await axiosInstance.post<Submission>("/submissions", input);
  return response.data;
}

export async function updateSubmission(
  id: number,
  input: UpdateSubmissionInput
): Promise<Submission> {
  const response = await axiosInstance.put<Submission>(`/submissions/${id}`, input);
  return response.data;
}

export async function gradeSubmission(
  id: number,
  input: GradeSubmissionInput
): Promise<Submission> {
  const response = await axiosInstance.put<Submission>(`/submissions/${id}/grade`, input);
  return response.data;
}
