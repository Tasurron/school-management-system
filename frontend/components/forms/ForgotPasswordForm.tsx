"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordEmailSchema,
  ForgotPasswordEmailValues,
  resetPasswordSchema,
  ResetPasswordValues,
} from "@/schemas/forgotPasswordSchema";
import * as authService from "@/services/authService";
import { getErrorMessage } from "@/services/axiosInstance";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SuccessMessage } from "@/components/ui/SuccessMessage";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetSucceeded, setResetSucceeded] = useState(false);

  const emailForm = useForm<ForgotPasswordEmailValues>({
    resolver: zodResolver(forgotPasswordEmailSchema),
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSendOtp(values: ForgotPasswordEmailValues) {
    setServerError(null);
    try {
      await authService.forgotPassword(values.email);
      setEmail(values.email);
      setSuccessMessage(`If ${values.email} is registered, a reset code has been sent to it.`);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  async function onResetPassword(values: ResetPasswordValues) {
    if (!email) return;
    setServerError(null);
    setSuccessMessage(null);
    try {
      await authService.resetPassword(email, values.otp, values.newPassword);
      setSuccessMessage("Password reset successful! Redirecting to login...");
      setResetSucceeded(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  if (!email) {
    return (
      <form onSubmit={emailForm.handleSubmit(onSendOtp)} className="flex flex-col gap-4">
        {serverError && <ErrorMessage message={serverError} />}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={emailForm.formState.errors.email?.message}
          {...emailForm.register("email")}
        />
        <Button
          type="submit"
          variant="primary"
          isLoading={emailForm.formState.isSubmitting}
          className="mt-4 self-center"
        >
          {emailForm.formState.isSubmitting ? "Sending..." : "Send OTP"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="flex flex-col gap-4">
      {successMessage && <SuccessMessage message={successMessage} />}
      {serverError && <ErrorMessage message={serverError} />}
      <Input
        label="Reset code"
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="6-digit code"
        error={resetForm.formState.errors.otp?.message}
        {...resetForm.register("otp")}
      />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        error={resetForm.formState.errors.newPassword?.message}
        {...resetForm.register("newPassword")}
      />
      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={resetForm.formState.errors.confirmPassword?.message}
        {...resetForm.register("confirmPassword")}
      />
      <Button
        type="submit"
        variant="primary"
        isLoading={resetForm.formState.isSubmitting}
        disabled={resetSucceeded}
        className="mt-4 self-center"
      >
        {resetForm.formState.isSubmitting ? "Resetting..." : "Reset Password"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setEmail(null);
          setSuccessMessage(null);
          setServerError(null);
          setResetSucceeded(false);
        }}
        className="text-center text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        Use a different email
      </button>
    </form>
  );
}
