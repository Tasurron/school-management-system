import { z } from "zod";

export const GRADE_OPTIONS = [8, 9, 10, 11, 12] as const;
export const SECTION_OPTIONS = ["A", "B"] as const;

export const classSchema = z.object({
  grade: z.number({ message: "Class is required" }).refine((v) => GRADE_OPTIONS.includes(v as (typeof GRADE_OPTIONS)[number]), {
    message: "Select a valid class",
  }),
  section: z.enum(SECTION_OPTIONS, { message: "Section is required" }),
});

export type ClassFormValues = z.infer<typeof classSchema>;
