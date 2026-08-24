"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AssignmentForm } from "@/components/forms/AssignmentForm";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { getErrorMessage } from "@/services/axiosInstance";
import * as teacherAssignmentService from "@/services/teacherAssignmentService";
import { useAuth } from "@/hooks/useAuth";
import { TeacherAssignment } from "@/types/teacherAssignment";

export default function NewAssignmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const all = await teacherAssignmentService.getTeacherAssignments();
        setTeacherAssignments(all.filter((ta) => ta.teacherId === user?.id));
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    if (user) loadData();
  }, [user]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Assignment</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a new assignment for one of your classes.
        </p>
      </div>

      {isLoading && <Spinner label="Loading..." />}
      {error && <ErrorMessage message={error} />}

      {!isLoading && !error && teacherAssignments.length === 0 && (
        <EmptyState message="You are not assigned to teach any class/subject yet. Ask an admin to assign you first." />
      )}

      {!isLoading && !error && teacherAssignments.length > 0 && (
        <div className="max-w-xl rounded border border-slate-100 bg-white p-6 shadow-card">
          <AssignmentForm
            teacherAssignments={teacherAssignments}
            onSuccess={() => router.push("/teacher/assignments")}
            onCancel={() => router.push("/teacher/assignments")}
          />
        </div>
      )}
    </div>
  );
}
