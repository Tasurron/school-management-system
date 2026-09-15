"use client";

import { ReactNode, useState } from "react";
import { Role } from "@/types/user";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardShellProps {
  role: Role;
  children: ReactNode;
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onMenuClick={() => setIsMobileNavOpen((open) => !open)} />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 bg-navy-800 md:block">
          <Sidebar role={role} className="sticky top-16" />
        </aside>

        {/* Mobile sidebar (toggled) */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/50"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <aside className="relative z-50 w-64 bg-navy-800 shadow-xl fade-in">
              <Sidebar role={role} onNavigate={() => setIsMobileNavOpen(false)} />
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden bg-[#F5F6FB] p-4 sm:p-6">
          <div className="mx-auto max-w-6xl fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
