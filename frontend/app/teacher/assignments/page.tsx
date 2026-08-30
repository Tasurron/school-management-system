"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as assignmentService from "@/services/assignmentService";
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
        classId: assignment.classId,
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
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Assignments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, publish, and grade assignments for your classes.
          </p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="inline-flex items-center justify-center rounded bg-primary-500 px-4 py-2.5 text-sm font-semibold text-navy-900 transition-colors duration-200 hover:bg-navy-800 hover:text-white"
        >
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
                  <Td>{a.title}</Td>
                  <Td>{a.className}</Td>
                  <Td>{a.subjectName}</Td>
                  <Td>
                    <Badge tone={a.status === "Published" ? "green" : "gray"}>{a.status}</Badge>
                  </Td>
                  <Td>{new Date(a.deadline).toLocaleString()}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/teacher/assignments/${a.id}/submissions`}
                        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-primary-400 hover:bg-primary-50"
                      >
                        Submissions
                      </Link>
                      <Link
                        href={`/teacher/assignments/${a.id}/edit`}
                        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-primary-400 hover:bg-primary-50"
                      >
                        Edit
                      </Link>
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={busyId === a.id}
                        onClick={() => handleToggleStatus(a)}
                      >
                        {a.status === "Published" ? "Unpublish" : "Publish"}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(a)}>
                        Delete
                      </Button>
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
