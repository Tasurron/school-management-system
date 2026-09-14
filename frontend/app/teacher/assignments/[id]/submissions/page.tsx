"use client";

import { ReactNode, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Pencil, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import { IconLink } from "@/components/ui/IconLink";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as submissionService from "@/services/submissionService";
import * as assignmentService from "@/services/assignmentService";
import { useHighlightRow } from "@/hooks/useHighlightRow";
import { rowId } from "@/lib/globalSearch";
import { Submission } from "@/types/submission";
import { Assignment } from "@/types/assignment";

export default function AssignmentSubmissionsPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = Number(params.id);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [assignmentData, allSubmissions] = await Promise.all([
          assignmentService.getAssignmentById(assignmentId),
          submissionService.getSubmissions(),
        ]);
        setAssignment(assignmentData);
        setSubmissions(allSubmissions.filter((s) => s.assignmentId === assignmentId));
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [assignmentId]);

  useHighlightRow(!isLoading && !error);

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Submissions{assignment ? ` - ${assignment.title}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Review and grade student submissions.</p>
      </div>

      {isLoading && <Spinner label="Loading submissions..." />}
      {error && <ErrorMessage message={error} />}

      {!isLoading && !error && submissions.length === 0 && (
        <EmptyState message="No students have submitted this assignment yet." />
      )}

      {!isLoading && !error && submissions.length > 0 && (
        <div className="table-scroll rounded border border-slate-100 bg-white shadow-card">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-navy-50">
              <tr>
                <Th>Student</Th>
                <Th>Status</Th>
                <Th>Marks</Th>
                <Th>Submitted</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((s) => (
                <tr
                  key={s.id}
                  id={rowId("submission", s.id)}
                  className="scroll-mt-24 transition-colors duration-200 hover:bg-slate-50"
                >
                  <Td>{s.studentName}</Td>
                  <Td>
                    <Badge tone={s.status === "Graded" ? "green" : "yellow"}>{s.status}</Badge>
                  </Td>
                  <Td>{s.marks !== null ? `${s.marks} / ${s.maxMarks}` : "-"}</Td>
                  <Td>{new Date(s.submittedAt).toLocaleString()}</Td>
                  <Td>
                    <IconLink
                      href={`/teacher/submissions/${s.id}/grade`}
                      icon={s.status === "Graded" ? ClipboardCheck : Pencil}
                      label={s.status === "Graded" ? "View / update grade" : "Grade submission"}
                    />
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
