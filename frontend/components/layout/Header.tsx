"use client";

import { GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { NotificationBell } from "@/components/layout/NotificationBell";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Toggle menu"
        >
          <MenuIcon />
        </button>
        <span className="flex items-center gap-2 text-lg font-bold text-navy-800">
          <GraduationCap className="h-6 w-6 text-primary-500" />
          School Management System
        </span>
      </div>
      <div className="flex items-center gap-3">
        {user && <NotificationBell role={user.role} />}
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
          <p className="text-xs text-slate-500">{user?.role}</p>
        </div>
        <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-sm font-semibold text-white sm:flex">
          {user?.fullName?.charAt(0).toUpperCase()}
        </div>
        <Button variant="secondary" size="sm" onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
