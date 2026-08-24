import { z } from "zod";

export const submissionSchema = z.object({
  content: z.string().min(1, "Please write something before submitting"),
});

export type SubmissionFormValues = z.infer<typeof submissionSchema>;
