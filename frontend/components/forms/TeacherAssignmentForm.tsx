"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  teacherAssignmentSchema,
  TeacherAssignmentFormValues,
} from "@/schemas/teacherAssignmentSchema";
import * as teacherAssignmentService from "@/services/teacherAssignmentService";
import { getErrorMessage } from "@/services/axiosInstance";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SchoolClass } from "@/types/class";
import { Subject } from "@/types/subject";
import { User } from "@/types/user";

interface TeacherAssignmentFormProps {
  teachers: User[];
  subjects: Subject[];
  classes: SchoolClass[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function TeacherAssignmentForm({
  teachers,
  subjects,
  classes,
  onSuccess,
  onCancel,
}: TeacherAssignmentFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeacherAssignmentFormValues>({
    resolver: zodResolver(teacherAssignmentSchema),
  });

  async function onSubmit(values: TeacherAssignmentFormValues) {
    setServerError(null);
    try {
      await teacherAssignmentService.createTeacherAssignment(values);
      onSuccess();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <ErrorMessage message={serverError} />}
      <Select
        label="Teacher"
        error={errors.teacherId?.message}
        {...register("teacherId", { valueAsNumber: true })}
        defaultValue=""
      >
        <option value="" disabled>
          Select a teacher
        </option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.fullName}
          </option>
        ))}
      </Select>
      <Select
        label="Subject"
        error={errors.subjectId?.message}
        {...register("subjectId", { valueAsNumber: true })}
        defaultValue=""
      >
        <option value="" disabled>
          Select a subject
        </option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Select
        label="Class"
        error={errors.classId?.message}
        {...register("classId", { valueAsNumber: true })}
        defaultValue=""
      >
        <option value="" disabled>
          Select a class
        </option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Assign
        </Button>
      </div>
    </form>
  );
}
