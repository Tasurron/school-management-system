"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subjectSchema, SubjectFormValues } from "@/schemas/subjectSchema";
import * as subjectService from "@/services/subjectService";
import { getErrorMessage } from "@/services/axiosInstance";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Subject } from "@/types/subject";

interface SubjectFormProps {
  subject?: Subject;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SubjectForm({ subject, onSuccess, onCancel }: SubjectFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!subject;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: subject?.name ?? "", code: subject?.code ?? "" },
  });

  async function onSubmit(values: SubjectFormValues) {
    setServerError(null);
    try {
      const input = { name: values.name, code: values.code || null };
      if (isEdit && subject) {
        await subjectService.updateSubject(subject.id, input);
      } else {
        await subjectService.createSubject(input);
      }
      onSuccess();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <ErrorMessage message={serverError} />}
      <Input label="Subject name" error={errors.name?.message} {...register("name")} />
      <Input label="Code (optional)" error={errors.code?.message} {...register("code")} />
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? "Save changes" : "Create subject"}
        </Button>
      </div>
    </form>
  );
}
