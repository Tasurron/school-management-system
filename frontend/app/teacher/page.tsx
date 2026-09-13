"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, CheckCircle2, FileEdit, Clock, Plus } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as assignmentService from "@/services/assignmentService";
import * as submissionService from "@/services/submissionService";

interface Stats {
  total: number;
  published: number;
  draft: number;
  ungraded: number;
}

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [assignments, submissions] = await Promise.all([
          assignmentService.getAssignments(),
          submissionService.getSubmissions(),
        ]);
        setStats({
          total: assignments.length,
          published: assignments.filter((a) => a.status === "Published").length,
          draft: assignments.filter((a) => a.status === "Draft").length,
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
    </div>
  );
}
