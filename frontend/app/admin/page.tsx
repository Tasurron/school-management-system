"use client";

import { useEffect, useState } from "react";
import { Users, School, BookOpen, ClipboardList } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as userService from "@/services/userService";
import * as classService from "@/services/classService";
import * as subjectService from "@/services/subjectService";
import * as assignmentService from "@/services/assignmentService";

interface Stats {
  users: number;
  classes: number;
  subjects: number;
  assignments: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [users, classes, subjects, assignments] = await Promise.all([
          userService.getUsers(),
          classService.getClasses(),
          subjectService.getSubjects(),
          assignmentService.getAssignments(),
        ]);
        setStats({
          users: users.length,
          classes: classes.length,
          subjects: subjects.length,
          assignments: assignments.length,
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of the whole system.</p>
      </div>

      {isLoading && <Spinner label="Loading stats..." />}
      {error && <ErrorMessage message={error} />}

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Users" value={stats.users} icon={Users} tone="navy" />
          <StatCard label="Classes" value={stats.classes} icon={School} tone="gray" />
          <StatCard label="Subjects" value={stats.subjects} icon={BookOpen} tone="green" />
          <StatCard label="Assignments" value={stats.assignments} icon={ClipboardList} tone="amber" />
        </div>
      )}
    </div>
  );
}
