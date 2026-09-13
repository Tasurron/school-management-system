import axiosInstance from "./axiosInstance";
import { AppNotification, UnreadCount } from "@/types/notification";

export async function getNotifications(): Promise<AppNotification[]> {
  const response = await axiosInstance.get<AppNotification[]>("/notifications");
  return response.data;
}

export async function getUnreadCount(): Promise<UnreadCount> {
  const response = await axiosInstance.get<UnreadCount>("/notifications/unread-count");
  return response.data;
}

export async function markAsRead(id: number): Promise<void> {
  await axiosInstance.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await axiosInstance.patch("/notifications/read-all");
}
