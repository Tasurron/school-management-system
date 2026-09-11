export interface Subject {
  id: number;
  name: string;
  code: string | null;
  applicableGrades: number[];
}

export interface SubjectInput {
  name: string;
  code?: string | null;
  applicableGrades: number[];
}
