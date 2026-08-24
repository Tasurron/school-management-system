"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserSchema,
  CreateUserFormValues,
  updateUserSchema,
  UpdateUserFormValues,
} from "@/schemas/userSchema";
import * as userService from "@/services/userService";
import { getErrorMessage } from "@/services/axiosInstance";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SchoolClass } from "@/types/class";
import { User } from "@/types/user";

interface UserFormProps {
  mode: "create" | "edit";
  user?: User;
  classes: SchoolClass[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ mode, user, classes, onSuccess, onCancel }: UserFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  if (mode === "create") {
    return (
      <CreateUserFormBody
        classes={classes}
        onSuccess={onSuccess}
        onCancel={onCancel}
        serverError={serverError}
        setServerError={setServerError}
      />
    );
  }

  if (!user) return null;

  return (
    <EditUserFormBody
      user={user}
      classes={classes}
      onSuccess={onSuccess}
      onCancel={onCancel}
      serverError={serverError}
      setServerError={setServerError}
    />
  );
}

function CreateUserFormBody({
  classes,
  onSuccess,
  onCancel,
  serverError,
  setServerError,
}: {
  classes: SchoolClass[];
  onSuccess: () => void;
  onCancel: () => void;
  serverError: string | null;
  setServerError: (message: string | null) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "Student" },
  });

  const role = watch("role");

  async function onSubmit(values: CreateUserFormValues) {
    setServerError(null);
    try {
      await userService.createUser({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
        classId: values.role === "Student" ? values.classId ?? null : null,
      });
      onSuccess();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <ErrorMessage message={serverError} />}
      <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
      <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
      <Input
        label="Password"
        type="password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Select label="Role" error={errors.role?.message} {...register("role")}>
        <option value="Admin">Admin</option>
        <option value="Teacher">Teacher</option>
        <option value="Student">Student</option>
      </Select>
      {role === "Student" && (
        <Select
          label="Class"
          error={errors.classId?.message}
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
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Create user
        </Button>
      </div>
    </form>
  );
}

function EditUserFormBody({
  user,
  classes,
  onSuccess,
  onCancel,
  serverError,
  setServerError,
}: {
  user: User;
  classes: SchoolClass[];
  onSuccess: () => void;
  onCancel: () => void;
  serverError: string | null;
  setServerError: (message: string | null) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email,
      classId: user.classId,
    },
  });

  async function onSubmit(values: UpdateUserFormValues) {
    setServerError(null);
    try {
      await userService.updateUser(user.id, {
        fullName: values.fullName,
        email: values.email,
        classId: user.role === "Student" ? values.classId ?? null : null,
      });
      onSuccess();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <ErrorMessage message={serverError} />}
      <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
      <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
      {user.role === "Student" && (
        <Select
          label="Class"
          error={errors.classId?.message}
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
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
