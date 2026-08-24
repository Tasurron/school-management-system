"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classSchema, ClassFormValues } from "@/schemas/classSchema";
import * as classService from "@/services/classService";
import { getErrorMessage } from "@/services/axiosInstance";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SchoolClass } from "@/types/class";

interface ClassFormProps {
  schoolClass?: SchoolClass;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClassForm({ schoolClass, onSuccess, onCancel }: ClassFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!schoolClass;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: schoolClass?.name ?? "" },
  });

  async function onSubmit(values: ClassFormValues) {
    setServerError(null);
    try {
      if (isEdit && schoolClass) {
        await classService.updateClass(schoolClass.id, values);
      } else {
        await classService.createClass(values);
      }
      onSuccess();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <ErrorMessage message={serverError} />}
      <Input label="Class name" error={errors.name?.message} {...register("name")} />
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? "Save changes" : "Create class"}
        </Button>
      </div>
    </form>
  );
}
