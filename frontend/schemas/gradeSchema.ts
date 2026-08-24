import { z } from "zod";

/**
 * Builds a grade-form schema whose marks range is clamped to the specific
 * assignment's maxMarks (this is UX help only — the backend re-validates).
 */
export function getGradeSchema(maxMarks: number) {
  return z.object({
    marks: z
      .number({ message: "Marks are required" })
      .min(0, "Marks cannot be negative")
      .max(maxMarks, `Marks cannot exceed ${maxMarks}`),
    feedback: z.string().max(2000, "Feedback is too long").optional().or(z.literal("")),
  });
}

export type GradeFormValues = z.infer<ReturnType<typeof getGradeSchema>>;
