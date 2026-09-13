using SchoolMS.Business.DTOs.Notifications;
using SchoolMS.Data.Enums;

namespace SchoolMS.Business.Interfaces;

public interface INotificationService
{
    // Called internally by other services right after a state-changing action
    // succeeds, to fan a notification out to every affected user. Not exposed
    // via a controller.
    Task NotifyUsersAsync(
        IEnumerable<int> userIds,
        NotificationType type,
        string title,
        string message,
        int? relatedEntityId = null);

    Task<List<NotificationResponseDto>> GetMyNotificationsAsync(int currentUserId);
    Task<UnreadCountResponseDto> GetUnreadCountAsync(int currentUserId);
    Task MarkAsReadAsync(int id, int currentUserId);
    Task MarkAllAsReadAsync(int currentUserId);
}
