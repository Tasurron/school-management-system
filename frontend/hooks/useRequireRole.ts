"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types/user";

const ROLE_HOME: Record<Role, string> = {
  Admin: "/admin",
  Teacher: "/teacher",
  Student: "/student",
};

/**
 * Client-side route guard. Redirects to /login if nobody is signed in, or to
 * the user's own dashboard if they're signed in with the wrong role.
 * This is a UX convenience only - the backend is the real access boundary.
 */
export function useRequireRole(role: Role) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== role) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, isLoading, role, router]);

  return { user, isLoading, isAuthorized: !isLoading && !!user && user.role === role };
}
