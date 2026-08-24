import { z } from "zod";

export const teacherAssignmentSchema = z.object({
  teacherId: z.number({ message: "Please select a teacher" }).min(1, "Please select a teacher"),
  subjectId: z.number({ message: "Please select a subject" }).min(1, "Please select a subject"),
  classId: z.number({ message: "Please select a class" }).min(1, "Please select a class"),
});

export type TeacherAssignmentFormValues = z.infer<typeof teacherAssignmentSchema>;
