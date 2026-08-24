import { z } from "zod";

const roleEnum = z.enum(["Admin", "Teacher", "Student"]);

// Used when creating a brand-new user (password + role required).
export const createUserSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: roleEnum,
    classId: z.number().optional().nullable(),
  })
  .refine((data) => data.role !== "Student" || !!data.classId, {
    message: "Class is required for students",
    path: ["classId"],
  });

// Used when editing an existing user (no password/role change here).
export const updateUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  classId: z.number().optional().nullable(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
