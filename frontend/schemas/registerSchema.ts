import { z } from "zod";

const roleEnum = z.enum(["Admin", "Teacher", "Student"]);

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: roleEnum,
    classId: z.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
    if (data.role === "Student" && !data.classId) {
      ctx.addIssue({
        code: "custom",
        message: "Class is required for students",
        path: ["classId"],
      });
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
