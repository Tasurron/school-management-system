export type NotificationType =
  | "AssignmentPublished"
  | "AssignmentDeadlineChanged"
  | "AssignmentDeleted"
  | "SubmissionReceived"
  | "SubmissionResubmitted"
  | "SubmissionGraded"
  | "TeacherAssigned"
  | "TeacherUnassigned"
  | "UserAccountCreated"
  | "UserAccountUpdated"
  | "UserAccountDeactivated"
  | "NewUserRegistered"
  | "ClassChanged"
  | "SubjectChanged";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}
