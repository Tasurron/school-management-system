import { z } from "zod";
import { GRADE_OPTIONS } from "@/schemas/classSchema";

export { GRADE_OPTIONS };

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100, "Name is too long"),
  code: z.string().max(20, "Code is too long").optional().or(z.literal("")),
  applicableGrades: z.array(z.number()),
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;
