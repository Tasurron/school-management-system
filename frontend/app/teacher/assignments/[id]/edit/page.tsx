"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AssignmentForm } from "@/components/forms/AssignmentForm";
import { BackButton } from "@/components/ui/BackButton";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as assignmentService from "@/services/assignmentService";
import * as subjectService from "@/services/subjectService";
import { Assignment } from "@/types/assignment";
import { Subject } from "@/types/subject";

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const assignmentId = Number(params.id);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [assignmentData, subjectsData] = await Promise.all([
          assignmentService.getAssignmentById(assignmentId),
          subjectService.getSubjects(),
        ]);
        setAssignment(assignmentData);
        setSubjects(subjectsData);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    queueMicrotask(loadData);
  }, [assignmentId]);

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Assignment</h1>
        <p className="mt-1 text-sm text-slate-500">Update the details of this assignment.</p>
      </div>

      {isLoading && <Spinner label="Loading assignment..." />}
      {error && <ErrorMessage message={error} />}

      {!isLoading && !error && assignment && (
        <div className="max-w-3xl rounded border border-slate-100 bg-white p-6 shadow-card">
          <AssignmentForm
            subjects={subjects}
            assignment={assignment}
            onSuccess={() => router.push("/teacher/assignments")}
            onCancel={() => router.push("/teacher/assignments")}
          />
        </div>
      )}
    </div>
  );
}
