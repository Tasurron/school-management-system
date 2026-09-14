"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ClipboardList,
  CalendarClock,
  CheckCircle2,
  ShieldCheck,
  Users,
  BookOpen,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { SearchInput } from "@/components/ui/SearchInput";
import { flashHighlight } from "@/lib/flashHighlight";
import { Role } from "@/types/user";

const ROLE_HOME: Record<Role, string> = {
  Admin: "/admin",
  Teacher: "/teacher",
  Student: "/student",
};

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) router.replace(ROLE_HOME[user.role]);
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      <Hero />
      <Features />
      <RoleHighlights />
      <Footer />
    </div>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <span className="flex items-center gap-2 text-lg font-bold text-navy-800">
          <GraduationCap className="h-6 w-6 text-primary-500" />
          School Management System
        </span>
        <div className="flex items-center gap-2">
          <PageSearch />
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
            <Link
              href="/login"
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-navy-800 transition-colors duration-200 hover:text-primary-600"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-primary-500 px-4 py-1.5 text-sm font-semibold text-navy-900 transition-all duration-200 hover:bg-navy-800 hover:text-white hover:shadow-md"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// Icon-triggered "search this page" popover, matching the dashboards'
// notification-bell/search interaction pattern: click the icon to open a
// small panel instead of showing an always-visible search box.
function PageSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notFound, setNotFound] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close the panel when clicking outside it or pressing Escape.
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  // Autofocus the input as soon as the panel opens.
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  function handleToggle() {
    setIsOpen((open) => {
      const next = !open;
      if (!next) {
        setQuery("");
        setNotFound(false);
      }
      return next;
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const match = searchPageSections(query);
    if (!match) {
      setNotFound(true);
      return;
    }
    setNotFound(false);
    setIsOpen(false);
    const element = document.getElementById(match.id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      flashHighlight(element);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Search"
        className="rounded-full p-2 text-slate-600 transition-colors duration-200 hover:bg-slate-100"
      >
        <Search className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fade-in absolute right-0 z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded border border-slate-100 bg-white p-3 shadow-lg">
          <form onSubmit={handleSearch}>
            <SearchInput
              ref={inputRef}
              submittable
              placeholder="Search this page..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setNotFound(false);
              }}
            />
          </form>
          {notFound && <p className="mt-2 text-xs text-red-600">No matching section found.</p>}
        </div>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section className="bg-[#f5f5f5] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="fade-in text-3xl font-bold leading-tight text-navy-800 sm:text-5xl">
          Assignments, submissions,
          <br />
          and grading — <span className="text-primary-500">all in one place</span>
        </h1>
        <p
          className="fade-in mx-auto mt-5 max-w-2xl text-base text-slate-500 sm:text-lg"
          style={{ animationDelay: "80ms", animationFillMode: "backwards" }}
        >
          A simple, role-based system for schools and colleges. Teachers create and grade
          assignments, students submit before the deadline, and admins keep everything organized.
        </p>
        <div
          className="fade-in mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "160ms", animationFillMode: "backwards" }}
        >
          <Link
            href="/register"
            className="w-full rounded-full bg-primary-500 px-6 py-2.5 text-sm font-semibold text-navy-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-navy-800 hover:text-white hover:shadow-md sm:w-auto"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="w-full rounded-full border border-navy-800/20 px-6 py-2.5 text-sm font-semibold text-navy-800 transition-colors duration-200 hover:bg-white sm:w-auto"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    id: "feature-assignment-management",
    icon: ClipboardList,
    title: "Assignment management",
    description:
      "Teachers create assignments for a class and subject, set a deadline and max marks, and publish when ready.",
  },
  {
    id: "feature-deadline-aware-submissions",
    icon: CalendarClock,
    title: "Deadline-aware submissions",
    description:
      "Students submit before the deadline and can update their answer right up until it's graded.",
  },
  {
    id: "feature-instant-grading",
    icon: CheckCircle2,
    title: "Instant grading & feedback",
    description:
      "Teachers grade submissions with marks and written feedback, visible to the student immediately.",
  },
  {
    id: "feature-secure-access",
    icon: ShieldCheck,
    title: "Secure, role-based access",
    description:
      "JWT authentication with server-enforced roles — every user only ever sees what they're allowed to.",
  },
];

function Features() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">Everything you need</h2>
          <p className="mt-3 text-sm text-slate-500 sm:text-base">
            A focused feature set that covers the full assignment lifecycle, end to end.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              id={feature.id}
              className="group scroll-mt-24 rounded border border-slate-100 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 transition-transform duration-200 group-hover:scale-110">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-navy-800">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROLES = [
  {
    id: "role-admin",
    icon: ShieldCheck,
    title: "Admin",
    description: "Manage users, classes, subjects, and assign teachers to their subjects and classes.",
  },
  {
    id: "role-teacher",
    icon: BookOpen,
    title: "Teacher",
    description: "Create and publish assignments, review submissions, and grade with feedback.",
  },
  {
    id: "role-student",
    icon: Users,
    title: "Student",
    description: "View assignments for your class, submit your work, and track your marks and feedback.",
  },
];

// All searchable sections on this page, used by the nav's "search this page" box.
const SEARCHABLE_SECTIONS = [...FEATURES, ...ROLES];

function searchPageSections(rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return null;

  // Check every section's title before falling back to descriptions. Without
  // this split, searching "student" or "teacher" would match a feature card
  // whose description happens to mention "Students"/"Teachers" in passing
  // (e.g. "Students submit before the deadline...") before ever reaching the
  // Student/Teacher role card the search term actually names.
  return (
    SEARCHABLE_SECTIONS.find((section) => section.title.toLowerCase().includes(query)) ??
    SEARCHABLE_SECTIONS.find((section) => section.description.toLowerCase().includes(query)) ??
    undefined
  );
}

function RoleHighlights() {
  return (
    <section className="bg-[#f5f5f5] px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">Built for every role</h2>
          <p className="mt-3 text-sm text-slate-500 sm:text-base">
            A dedicated, focused dashboard for whoever is signed in.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {ROLES.map((role) => (
            <div
              key={role.title}
              id={role.id}
              className="group scroll-mt-24 rounded bg-white p-8 text-center shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-800 text-white transition-transform duration-200 group-hover:scale-110">
                <role.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-navy-800">{role.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{role.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-navy-900 px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="flex items-center gap-2 text-lg font-bold text-white">
          <GraduationCap className="h-6 w-6 text-primary-500" />
          School Management System
        </span>
        <p className="text-sm text-slate-300">
          &copy; {new Date().getFullYear()} School Management System. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
