export type AssignmentStatus = "Draft" | "Published";

export interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: string; // ISO date string
  maxMarks: number;
  status: AssignmentStatus;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface AssignmentInput {
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  classId: number;
  subjectId: number;
  status?: AssignmentStatus;
}
