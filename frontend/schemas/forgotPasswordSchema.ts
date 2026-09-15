import { z } from "zod";

export const forgotPasswordEmailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export type ForgotPasswordEmailValues = z.infer<typeof forgotPasswordEmailSchema>;

export const resetPasswordSchema = z
  .object({
    otp: z
      .string()
      .min(1, "Reset code is required")
      .length(6, "Reset code must be 6 digits")
      .regex(/^\d+$/, "Reset code must contain only digits"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
