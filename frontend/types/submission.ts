export type SubmissionStatus = "Submitted" | "Graded";

export interface Submission {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  studentId: number;
  studentName: string;
  content: string;
  submittedAt: string;
  updatedAt: string | null;
  status: SubmissionStatus;
  marks: number | null;
  feedback: string | null;
  maxMarks: number;
}

export interface CreateSubmissionInput {
  assignmentId: number;
  content: string;
}

export interface UpdateSubmissionInput {
  content: string;
}

export interface GradeSubmissionInput {
  marks: number;
  feedback: string;
}
