"use client";

import { ReactNode, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as assignmentService from "@/services/assignmentService";
import * as submissionService from "@/services/submissionService";
import { formatDeadline } from "@/lib/formatDateTime";
import { useHighlightRow } from "@/hooks/useHighlightRow";
import { rowId } from "@/lib/globalSearch";
import { Assignment } from "@/types/assignment";
import { Submission } from "@/types/submission";

export default function AdminOverviewPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [assignmentsData, submissionsData] = await Promise.all([
          assignmentService.getAssignments(),
          submissionService.getSubmissions(),
        ]);
        setAssignments(assignmentsData);
        setSubmissions(submissionsData);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useHighlightRow(!isLoading && !error);

  return (
    <div className="flex flex-col gap-8">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assignments &amp; Submissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          A read-only view of everything happening across the system.
        </p>
      </div>

      {isLoading && <Spinner label="Loading overview..." />}
      {error && <ErrorMessage message={error} />}

      {!isLoading && !error && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-slate-900">All Assignments</h2>
            {assignments.length === 0 ? (
              <EmptyState message="No assignments found." />
            ) : (
              <div className="table-scroll rounded border border-slate-100 bg-white shadow-card">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-navy-100">
                    <tr>
                      <Th>Title</Th>
                      <Th>Class</Th>
                      <Th>Subject</Th>
                      <Th>Teacher</Th>
                      <Th>Status</Th>
                      <Th>Deadline</Th>
                      <Th>Marks</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments.map((a) => (
                      <tr
                        key={a.id}
                        id={rowId("assignment", a.id)}
                        className="scroll-mt-24 transition-colors duration-200 hover:bg-slate-50"
                      >
                        <Td>{a.title}</Td>
                        <Td>{a.className}</Td>
                        <Td>{a.subjectName}</Td>
                        <Td>{a.teacherName}</Td>
                        <Td>
                          <Badge tone={a.status === "Published" ? "green" : "gray"}>
                            {a.status}
                          </Badge>
                        </Td>
                        <Td>{formatDeadline(a.deadline)}</Td>
                        <Td>{a.maxMarks}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-slate-900">All Submissions</h2>
            {submissions.length === 0 ? (
              <EmptyState message="No submissions found." />
            ) : (
              <div className="table-scroll rounded border border-slate-100 bg-white shadow-card">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-navy-100">
                    <tr>
                      <Th>Assignment</Th>
                      <Th>Student</Th>
                      <Th>Status</Th>
                      <Th>Marks</Th>
                      <Th>Submitted</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((s) => (
                      <tr
                        key={s.id}
                        id={rowId("submission", s.id)}
                        className="scroll-mt-24 transition-colors duration-200 hover:bg-slate-50"
                      >
                        <Td>{s.assignmentTitle}</Td>
                        <Td>{s.studentName}</Td>
                        <Td>
                          <Badge tone={s.status === "Graded" ? "green" : "yellow"}>
                            {s.status}
                          </Badge>
                        </Td>
                        <Td>{s.marks !== null ? `${s.marks} / ${s.maxMarks}` : "-"}</Td>
                        <Td>{new Date(s.submittedAt).toLocaleString()}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
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
