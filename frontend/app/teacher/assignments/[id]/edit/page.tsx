"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AssignmentForm } from "@/components/forms/AssignmentForm";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as assignmentService from "@/services/assignmentService";
import * as teacherAssignmentService from "@/services/teacherAssignmentService";
import { useAuth } from "@/hooks/useAuth";
import { Assignment } from "@/types/assignment";
import { TeacherAssignment } from "@/types/teacherAssignment";

export default function EditAssignmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const assignmentId = Number(params.id);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [assignmentData, allTeacherAssignments] = await Promise.all([
          assignmentService.getAssignmentById(assignmentId),
          teacherAssignmentService.getTeacherAssignments(),
        ]);
        setAssignment(assignmentData);
        setTeacherAssignments(allTeacherAssignments.filter((ta) => ta.teacherId === user?.id));
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    if (user) loadData();
  }, [assignmentId, user]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Assignment</h1>
        <p className="mt-1 text-sm text-slate-500">Update the details of this assignment.</p>
      </div>

      {isLoading && <Spinner label="Loading assignment..." />}
      {error && <ErrorMessage message={error} />}

      {!isLoading && !error && assignment && (
        <div className="max-w-xl rounded border border-slate-100 bg-white p-6 shadow-card">
          <AssignmentForm
            teacherAssignments={teacherAssignments}
            assignment={assignment}
            onSuccess={() => router.push("/teacher/assignments")}
            onCancel={() => router.push("/teacher/assignments")}
          />
        </div>
      )}
    </div>
  );
}
