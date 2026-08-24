"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GradeForm } from "@/components/forms/GradeForm";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SuccessMessage } from "@/components/ui/SuccessMessage";
import { Card } from "@/components/ui/Card";
import { getErrorMessage } from "@/services/axiosInstance";
import * as submissionService from "@/services/submissionService";
import { Submission } from "@/types/submission";

export default function GradeSubmissionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const submissionId = Number(params.id);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setSubmission(await submissionService.getSubmissionById(submissionId));
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [submissionId]);

  function handleGraded(updated: Submission) {
    setSubmission(updated);
    setSuccessMessage("Grade saved successfully.");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Grade Submission</h1>
        <p className="mt-1 text-sm text-slate-500">Review the student&apos;s answer and grade it.</p>
      </div>

      {isLoading && <Spinner label="Loading submission..." />}
      {error && <ErrorMessage message={error} />}

      {!isLoading && !error && submission && (
        <div className="flex max-w-2xl flex-col gap-6">
          {successMessage && <SuccessMessage message={successMessage} />}

          <Card>
            <p className="text-sm font-medium text-slate-500">Assignment</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {submission.assignmentTitle}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">Student</p>
            <p className="mt-1 text-base text-slate-900">{submission.studentName}</p>
            <p className="mt-3 text-sm font-medium text-slate-500">Submitted answer</p>
            <p className="mt-1 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-800">
              {submission.content}
            </p>
          </Card>

          <div className="rounded border border-slate-100 bg-white p-6 shadow-card">
            <GradeForm submission={submission} onSuccess={handleGraded} />
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="self-start text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-slate-700"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
