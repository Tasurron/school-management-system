import { z } from "zod";

export const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().min(1, "Description is required"),
  deadline: z.string().min(1, "Deadline is required"),
  maxMarks: z
    .number({ message: "Max marks is required" })
    .min(1, "Max marks must be at least 1")
    .max(1000, "Max marks is too large"),
  // "classId:subjectId" packed into one dropdown value, split apart before submit.
  classSubjectKey: z.string().min(1, "Please select a class + subject"),
  status: z.enum(["Draft", "Published"]),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;
