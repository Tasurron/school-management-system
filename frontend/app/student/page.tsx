"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as assignmentService from "@/services/assignmentService";
import { formatDeadline } from "@/lib/formatDateTime";
import { Assignment } from "@/types/assignment";

export default function StudentDashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // The backend already scopes this to Published assignments for the
        // student's own class - nothing extra to filter here.
        setAssignments(await assignmentService.getAssignments());
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Assignments</h1>
        <p className="mt-1 text-sm text-slate-500">Published assignments for your class.</p>
      </div>

      {isLoading && <Spinner label="Loading assignments..." />}
      {error && <ErrorMessage message={error} />}

      {!isLoading && !error && assignments.length === 0 && (
        <EmptyState message="No assignments have been published for your class yet." />
      )}

      {!isLoading && !error && assignments.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a) => {
            const isPastDeadline = now > new Date(a.deadline);
            return (
              <Link
                key={a.id}
                href={`/student/assignments/${a.id}`}
                className="flex flex-col gap-2 rounded border border-slate-100 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  <Badge tone={isPastDeadline ? "red" : "green"}>
                    {isPastDeadline ? "Past deadline" : "Open"}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {a.subjectName} - {a.className}
                </p>
                <p className="text-xs text-slate-400">
                  Deadline: {formatDeadline(a.deadline)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
