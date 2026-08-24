"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submissionSchema, SubmissionFormValues } from "@/schemas/submissionSchema";
import * as submissionService from "@/services/submissionService";
import { getErrorMessage } from "@/services/axiosInstance";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SuccessMessage } from "@/components/ui/SuccessMessage";
import { Submission } from "@/types/submission";

interface SubmissionFormProps {
  assignmentId: number;
  /** Present when the student is editing an existing (ungraded, not-yet-locked) submission. */
  existingSubmission?: Submission;
  onSuccess: (submission: Submission) => void;
}

export function SubmissionForm({
  assignmentId,
  existingSubmission,
  onSuccess,
}: SubmissionFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isEdit = !!existingSubmission;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { content: existingSubmission?.content ?? "" },
  });

  async function onSubmit(values: SubmissionFormValues) {
    setServerError(null);
    setSuccessMessage(null);
    try {
      const saved = isEdit
        ? await submissionService.updateSubmission(existingSubmission.id, values)
        : await submissionService.createSubmission({ assignmentId, content: values.content });
      setSuccessMessage(isEdit ? "Your submission has been updated." : "Submitted successfully.");
      onSuccess(saved);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <ErrorMessage message={serverError} />}
      {successMessage && <SuccessMessage message={successMessage} />}
      <Textarea
        label="Your answer"
        rows={8}
        error={errors.content?.message}
        {...register("content")}
      />
      <Button type="submit" isLoading={isSubmitting} className="self-start">
        {isEdit ? "Update submission" : "Submit assignment"}
      </Button>
    </form>
  );
}
