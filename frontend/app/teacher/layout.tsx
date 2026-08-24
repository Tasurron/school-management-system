"use client";

import { ReactNode } from "react";
import { useRequireRole } from "@/hooks/useRequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Spinner } from "@/components/ui/Spinner";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthorized } = useRequireRole("Teacher");

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Checking your session..." />
      </div>
    );
  }

  return <DashboardShell role="Teacher">{children}</DashboardShell>;
}
