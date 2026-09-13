"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as submissionService from "@/services/submissionService";
import { Submission } from "@/types/submission";

export default function StudentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // The backend already scopes this to the signed-in student's own submissions.
        setSubmissions(await submissionService.getSubmissions());
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Submissions</h1>
        <p className="mt-1 text-sm text-slate-500">Everything you&apos;ve submitted so far.</p>
      </div>

      {isLoading && <Spinner label="Loading submissions..." />}
      {error && <ErrorMessage message={error} />}

      {!isLoading && !error && submissions.length === 0 && (
        <EmptyState message="You haven't submitted any assignments yet." />
      )}

      {!isLoading && !error && submissions.length > 0 && (
        <div className="table-scroll rounded border border-slate-100 bg-white shadow-card">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-navy-50">
              <tr>
                <Th>Assignment</Th>
                <Th>Status</Th>
                <Th>Marks</Th>
                <Th>Feedback</Th>
                <Th>Submitted</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((s) => (
                <tr key={s.id} className="transition-colors duration-200 hover:bg-slate-50">
                  <Td>{s.assignmentTitle}</Td>
                  <Td>
                    <Badge tone={s.status === "Graded" ? "green" : "yellow"}>{s.status}</Badge>
                  </Td>
                  <Td>{s.marks !== null ? `${s.marks} / ${s.maxMarks}` : "-"}</Td>
                  <Td>{s.feedback || "-"}</Td>
                  <Td>{new Date(s.submittedAt).toLocaleString()}</Td>
                  <Td>
                    <Link
                      href={`/student/assignments/${s.assignmentId}`}
                      className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-primary-400 hover:bg-primary-50"
                    >
                      View
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3 text-slate-700">{children}</td>;
}
