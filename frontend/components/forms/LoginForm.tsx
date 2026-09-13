"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "@/schemas/loginSchema";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/axiosInstance";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Role } from "@/types/user";

const ROLE_HOME: Record<Role, string> = {
  Admin: "/admin",
  Teacher: "/teacher",
  Student: "/student",
};

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const user = await login(values.email, values.password);
      router.push(ROLE_HOME[user.role]);
    } catch (error) {
      setServerError(
        "Invalid email or password. Please double-check your details and try again."
      );
      // Keep the underlying message available for debugging via console.
      console.warn(getErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <ErrorMessage message={serverError} />}
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" variant="secondary" isLoading={isSubmitting} className="mt-4 w-full">
        {isSubmitting ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}
