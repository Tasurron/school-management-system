"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, CheckCircle2, FileEdit, Clock, Plus } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as assignmentService from "@/services/assignmentService";
import * as submissionService from "@/services/submissionService";
import { getSubjectAbbreviation } from "@/lib/subjectAbbreviations";
import { formatDeadline } from "@/lib/formatDateTime";
import { Assignment } from "@/types/assignment";

interface Stats {
  total: number;
  published: number;
  draft: number;
  ungraded: number;
}

export default function TeacherDashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const [assignmentsData, submissions] = await Promise.all([
          assignmentService.getAssignments(),
          submissionService.getSubmissions(),
        ]);
        setAssignments(assignmentsData);
        setStats({
          total: assignmentsData.length,
          published: assignmentsData.filter((a) => a.status === "Published").length,
          draft: assignmentsData.filter((a) => a.status === "Draft").length,
          ungraded: submissions.filter((s) => s.status === "Submitted").length,
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredAssignments = normalizedQuery
    ? assignments.filter((a) =>
        [a.title, a.subjectName, a.className].some((field) =>
          field.toLowerCase().includes(normalizedQuery)
        )
      )
    : assignments;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">A summary of your assignments.</p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold text-navy-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-navy-800 hover:text-white hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          New assignment
        </Link>
      </div>

      {isLoading && <Spinner label="Loading stats..." />}
      {error && <ErrorMessage message={error} />}

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Assignments" value={stats.total} icon={ClipboardList} tone="navy" />
          <StatCard label="Published" value={stats.published} icon={CheckCircle2} tone="green" />
          <StatCard label="Draft" value={stats.draft} icon={FileEdit} tone="amber" />
          <StatCard label="Awaiting Grading" value={stats.ungraded} icon={Clock} tone="gray" />
        </div>
      )}

      {!isLoading && !error && assignments.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-lg font-semibold text-slate-900">Your assignments</h2>
            <SearchInput
              placeholder="Search by title, subject, or class..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:w-72"
            />
          </div>

          {filteredAssignments.length === 0 ? (
            <EmptyState message="No assignments match your search." />
          ) : (
            <div className="table-scroll rounded border border-slate-100 bg-white shadow-card">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-navy-50">
                  <tr>
                    <Th>Title</Th>
                    <Th>Class</Th>
                    <Th>Subject</Th>
                    <Th>Status</Th>
                    <Th>Deadline</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.map((a) => (
                    <tr key={a.id} className="transition-colors duration-200 hover:bg-slate-50">
                      <Td>{a.title}</Td>
                      <Td>
                        {a.classGrade}
                        {a.classSection}
                      </Td>
                      <Td>
                        <span title={a.subjectName}>{getSubjectAbbreviation(a.subjectName)}</span>
                      </Td>
                      <Td>
                        <Badge tone={a.status === "Published" ? "green" : "gray"}>{a.status}</Badge>
                      </Td>
                      <Td>{formatDeadline(a.deadline)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
