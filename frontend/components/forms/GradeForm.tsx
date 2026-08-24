"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getGradeSchema, GradeFormValues } from "@/schemas/gradeSchema";
import * as submissionService from "@/services/submissionService";
import { getErrorMessage } from "@/services/axiosInstance";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Submission } from "@/types/submission";

interface GradeFormProps {
  submission: Submission;
  onSuccess: (submission: Submission) => void;
}

export function GradeForm({ submission, onSuccess }: GradeFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const schema = getGradeSchema(submission.maxMarks);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GradeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      marks: submission.marks ?? 0,
      feedback: submission.feedback ?? "",
    },
  });

  async function onSubmit(values: GradeFormValues) {
    setServerError(null);
    try {
      const saved = await submissionService.gradeSubmission(submission.id, {
        marks: values.marks,
        feedback: values.feedback ?? "",
      });
      onSuccess(saved);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <ErrorMessage message={serverError} />}
      <Input
        label={`Marks (0-${submission.maxMarks})`}
        type="number"
        min={0}
        max={submission.maxMarks}
        error={errors.marks?.message}
        {...register("marks", { valueAsNumber: true })}
      />
      <Textarea label="Feedback (optional)" error={errors.feedback?.message} {...register("feedback")} />
      <Button type="submit" isLoading={isSubmitting} className="self-start">
        {submission.status === "Graded" ? "Update grade" : "Submit grade"}
      </Button>
    </form>
  );
}
