export interface Subject {
  id: number;
  name: string;
  code: string | null;
}

export interface SubjectInput {
  name: string;
  code?: string | null;
}
