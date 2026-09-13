"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AssignmentForm } from "@/components/forms/AssignmentForm";
import { BackButton } from "@/components/ui/BackButton";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as subjectService from "@/services/subjectService";
import { Subject } from "@/types/subject";

export default function NewAssignmentPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setSubjects(await subjectService.getSubjects());
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    queueMicrotask(loadData);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Assignment</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a new assignment for one of your classes.
        </p>
      </div>

      {isLoading && <Spinner label="Loading..." />}
      {error && <ErrorMessage message={error} />}

      {!isLoading && !error && (
        <div className="max-w-xl rounded border border-slate-100 bg-white p-6 shadow-card">
          <AssignmentForm
            subjects={subjects}
            onSuccess={() => router.push("/teacher/assignments")}
            onCancel={() => router.push("/teacher/assignments")}
          />
        </div>
      )}
    </div>
  );
}
