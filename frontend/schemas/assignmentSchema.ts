import { z } from "zod";

export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ".doc",
  ".docx",
  ".pdf",
  ".xls",
  ".xlsx",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
];
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function hasAllowedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_ATTACHMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export const assignmentSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title is too long"),
    description: z.string().min(1, "Description is required"),
    deadline: z.string().min(1, "Please select both a deadline date and a deadline time"),
    maxMarks: z
      .number({ message: "Marks is required" })
      .min(1, "Marks must be at least 1")
      .max(1000, "Marks is too large"),
    classGrade: z.number().optional(),
    classSection: z.string().optional(),
    subjectId: z.number().optional(),
    status: z.enum(["Draft", "Published"]),
    attachment: z
      .instanceof(File)
      .optional()
      .nullable()
      .refine((file) => !file || file.size <= MAX_ATTACHMENT_SIZE_BYTES, "File must be 10 MB or smaller")
      .refine(
        (file) => !file || hasAllowedExtension(file.name),
        "Allowed files: Word, PDF, Excel, or image (.doc, .docx, .pdf, .xls, .xlsx, .jpg, .jpeg, .png, .gif, .webp)"
      ),
    removeAttachment: z.boolean().optional(),
  })
  .refine((data) => !!data.classGrade, { message: "Please select a class", path: ["classGrade"] })
  .refine((data) => !!data.classSection, { message: "Please select a section", path: ["classSection"] })
  .refine((data) => !!data.subjectId, { message: "Please select a subject", path: ["subjectId"] });

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;
