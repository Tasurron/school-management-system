"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import * as notificationService from "@/services/notificationService";
import { getErrorMessage } from "@/services/axiosInstance";
import { AppNotification, NotificationType } from "@/types/notification";
import { Role } from "@/types/user";

const POLL_INTERVAL_MS = 25000;

// Where clicking a notification should take the viewer, based on their own role
// (the same notification type can go to different people - e.g. a Teacher and an
// Admin both get notified when a teaching assignment changes, but land on different pages).
function getNotificationRoute(notification: AppNotification, role: Role): string | null {
  const { type, relatedEntityId } = notification;

  switch (type as NotificationType) {
    case "AssignmentPublished":
    case "AssignmentDeadlineChanged":
    case "SubmissionGraded":
      return relatedEntityId ? `/student/assignments/${relatedEntityId}` : null;
    case "SubmissionReceived":
    case "SubmissionResubmitted":
      return relatedEntityId ? `/teacher/assignments/${relatedEntityId}/submissions` : null;
    case "TeacherAssigned":
    case "TeacherUnassigned":
      return role === "Admin" ? "/admin/teacher-assignments" : "/teacher/assignments";
    case "UserAccountCreated":
    case "UserAccountUpdated":
    case "UserAccountDeactivated":
    case "NewUserRegistered":
      return role === "Admin" ? "/admin/users" : null;
    case "ClassChanged":
      return role === "Admin" ? "/admin/classes" : null;
    case "SubjectChanged":
      return role === "Admin" ? "/admin/subjects" : null;
    default:
      return null;
  }
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell({ role }: { role: Role }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const result = await notificationService.getUnreadCount();
      setUnreadCount(result.count);
    } catch {
      // Silently ignore - this is a background poll, not a user-initiated action.
    }
  }, []);

  useEffect(() => {
    queueMicrotask(refreshUnreadCount);
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  async function handleToggle() {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);
    if (!nextIsOpen) return;

    setIsLoading(true);
    setError(null);
    try {
      setNotifications(await notificationService.getNotifications());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleNotificationClick(notification: AppNotification) {
    setIsOpen(false);

    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      notificationService.markAsRead(notification.id).catch(() => {});
    }

    const route = getNotificationRoute(notification, role);
    if (route) {
      router.push(route);
    }
  }

  async function handleMarkAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-slate-600 transition-colors duration-200 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fade-in absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded border border-slate-100 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {notifications.some((n) => !n.isRead) && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-primary-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading && <p className="px-4 py-6 text-center text-sm text-slate-500">Loading...</p>}
            {error && <p className="px-4 py-6 text-center text-sm text-red-600">{error}</p>}
            {!isLoading && !error && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
            )}
            {!isLoading &&
              !error &&
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition-colors duration-200 last:border-b-0 hover:bg-slate-50 ${
                    notification.isRead ? "" : "bg-primary-50"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    {!notification.isRead && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                    )}
                    {notification.title}
                  </span>
                  <span className="text-xs text-slate-600">{notification.message}</span>
                  <span className="text-[11px] text-slate-400">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
