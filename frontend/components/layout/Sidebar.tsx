"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  School,
  BookOpen,
  ClipboardList,
  ClipboardCheck,
  FileCheck2,
} from "lucide-react";
import { Role } from "@/types/user";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_LINKS: Record<Role, NavLink[]> = {
  Admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/classes", label: "Classes", icon: School },
    { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
    { href: "/admin/teacher-assignments", label: "Teacher Assignments", icon: ClipboardList },
    { href: "/admin/overview", label: "Assignments & Submissions", icon: ClipboardCheck },
  ],
  Teacher: [
    { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teacher/assignments", label: "Assignment", icon: ClipboardList },
  ],
  Student: [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/submissions", label: "My Submissions", icon: FileCheck2 },
  ],
};

interface SidebarProps {
  role: Role;
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ role, className = "", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const links = NAV_LINKS[role];

  return (
    <nav className={`flex flex-col ${className}`}>
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 border-b border-navy-900 px-5 py-3 text-sm font-medium transition-colors duration-200 ${
              isActive ? "bg-navy-850 text-primary-500" : "text-slate-300 hover:text-white"
            }`}
          >
            <Icon
              className={`h-[18px] w-[18px] shrink-0 ${
                isActive ? "text-primary-500" : "text-primary-400"
              }`}
            />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
