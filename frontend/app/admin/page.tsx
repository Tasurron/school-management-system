"use client";

import { ReactNode, useEffect, useState } from "react";
import { Users, School, BookOpen, ClipboardList } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getErrorMessage } from "@/services/axiosInstance";
import * as userService from "@/services/userService";
import * as classService from "@/services/classService";
import * as subjectService from "@/services/subjectService";
import * as assignmentService from "@/services/assignmentService";
import { User } from "@/types/user";

interface Stats {
  users: number;
  classes: number;
  subjects: number;
  assignments: number;
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const [usersData, classes, subjects, assignments] = await Promise.all([
          userService.getUsers(),
          classService.getClasses(),
          subjectService.getSubjects(),
          assignmentService.getAssignments(),
        ]);
        setUsers(usersData);
        setStats({
          users: usersData.length,
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

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = normalizedQuery
    ? users.filter((u) =>
        [u.fullName, u.email, u.role].some((field) => field.toLowerCase().includes(normalizedQuery))
      )
    : users;

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

      {!isLoading && !error && users.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-lg font-semibold text-slate-900">Users</h2>
            <SearchInput
              placeholder="Search by name, email, or role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:w-72"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <EmptyState message="No users match your search." />
          ) : (
            <div className="table-scroll rounded border border-slate-100 bg-white shadow-card">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-navy-100">
                  <tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="transition-colors duration-200 hover:bg-slate-50">
                      <Td>{u.fullName}</Td>
                      <Td>{u.email}</Td>
                      <Td>{u.role}</Td>
                      <Td>
                        <Badge tone={u.isActive === false ? "red" : "green"}>
                          {u.isActive === false ? "Inactive" : "Active"}
                        </Badge>
                      </Td>
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
