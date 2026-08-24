import { z } from "zod";

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Name is too long"),
});

export type ClassFormValues = z.infer<typeof classSchema>;
