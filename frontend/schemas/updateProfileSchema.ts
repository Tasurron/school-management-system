import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(150, "Full name is too long"),
  newPassword: z
    .string()
    .refine((value) => value.length === 0 || value.length >= 6, {
      message: "Password must be at least 6 characters",
    }),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
