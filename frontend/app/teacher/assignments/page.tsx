"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Paperclip, ClipboardList, Pencil, Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import { IconButton } from "@/components/ui/IconButton";
import { IconLink } from "@/components/ui/IconLink";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as assignmentService from "@/services/assignmentService";
import { getSubjectAbbreviation } from "@/lib/subjectAbbreviations";
import { formatDeadline } from "@/lib/formatDateTime";
import { Assignment } from "@/types/assignment";

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      setAssignments(await assignmentService.getAssignments());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(loadData);
  }, []);

  async function handleToggleStatus(assignment: Assignment) {
    setActionError(null);
    setBusyId(assignment.id);
    try {
      await assignmentService.updateAssignment(assignment.id, {
        title: assignment.title,
        description: assignment.description,
        deadline: assignment.deadline,
        maxMarks: assignment.maxMarks,
        classGrade: assignment.classGrade,
        classSection: assignment.classSection,
        subjectId: assignment.subjectId,
        status: assignment.status === "Published" ? "Draft" : "Published",
      });
      await loadData();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(assignment: Assignment) {
    setActionError(null);
    if (!confirm(`Delete "${assignment.title}"? This cannot be undone.`)) return;
    try {
      await assignmentService.deleteAssignment(assignment.id);
      await loadData();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignment</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, publish, and grade assignments for your classes.
          </p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold tracking-[0.03em] text-navy-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-navy-800 hover:text-white hover:shadow-md active:translate-y-0"
        >
          <Plus className="h-4 w-4" />
          New assignment
        </Link>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {error && <ErrorMessage message={error} />}
      {isLoading && <Spinner label="Loading assignments..." />}

      {!isLoading && !error && assignments.length === 0 && (
        <EmptyState message="You haven't created any assignments yet." />
      )}

      {!isLoading && !error && assignments.length > 0 && (
        <div className="table-scroll rounded border border-slate-100 bg-white shadow-card">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-navy-50">
              <tr>
                <Th>Title</Th>
                <Th>Class</Th>
                <Th>Subject</Th>
                <Th>Status</Th>
                <Th>Deadline</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((a) => (
                <tr key={a.id} className="transition-colors duration-200 hover:bg-slate-50">
                  <Td>
                    <span className="inline-flex items-center gap-1.5">
                      {a.title}
                      {a.attachmentFileName && (
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="Has attachment" />
                      )}
                    </span>
                  </Td>
                  <Td>
                    <span title={a.className}>
                      {a.classGrade}
                      {a.classSection}
                    </span>
                  </Td>
                  <Td>
                    <span title={a.subjectName}>{getSubjectAbbreviation(a.subjectName)}</span>
                  </Td>
                  <Td>
                    <Badge tone={a.status === "Published" ? "green" : "gray"}>{a.status}</Badge>
                  </Td>
                  <Td>{formatDeadline(a.deadline)}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <IconLink
                        href={`/teacher/assignments/${a.id}/submissions`}
                        icon={ClipboardList}
                        label="View submissions"
                      />
                      <IconLink
                        href={`/teacher/assignments/${a.id}/edit`}
                        icon={Pencil}
                        label="Edit assignment"
                      />
                      <IconButton
                        icon={a.status === "Published" ? EyeOff : Eye}
                        label={a.status === "Published" ? "Unpublish" : "Publish"}
                        disabled={busyId === a.id}
                        onClick={() => handleToggleStatus(a)}
                      />
                      <IconButton
                        icon={Trash2}
                        label="Delete assignment"
                        tone="danger"
                        onClick={() => handleDelete(a)}
                      />
                    </div>
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
