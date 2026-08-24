"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormValues } from "@/schemas/registerSchema";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/axiosInstance";
import * as classService from "@/services/classService";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Role } from "@/types/user";
import { SchoolClass } from "@/types/class";

const ROLE_HOME: Record<Role, string> = {
  Admin: "/admin",
  Teacher: "/teacher",
  Student: "/student",
};

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classesError, setClassesError] = useState(false);

  useEffect(() => {
    classService
      .getClasses()
      .then(setClasses)
      .catch(() => setClassesError(true));
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "Student" },
  });

  const role = watch("role");

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      const user = await registerUser({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
        classId: values.role === "Student" ? values.classId ?? null : null,
      });
      router.push(ROLE_HOME[user.role]);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <ErrorMessage message={serverError} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Select
          label="Register as"
          error={errors.role?.message}
          className={role !== "Student" ? "sm:col-span-2" : undefined}
          {...register("role")}
        >
          <option value="Student">Student</option>
          <option value="Teacher">Teacher</option>
          <option value="Admin">Admin</option>
        </Select>
        {role === "Student" && (
          <Select
            label="Class"
            error={errors.classId?.message ?? (classesError ? "Could not load classes" : undefined)}
            {...register("classId", { valueAsNumber: true })}
          >
            <option value="">Select a class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </div>
      <Button type="submit" variant="secondary" isLoading={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
