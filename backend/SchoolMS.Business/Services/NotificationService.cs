using Microsoft.EntityFrameworkCore;
using SchoolMS.Business.DTOs.Notifications;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Enums;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Business.Services;

public class NotificationService : INotificationService
{
    // Most recent notifications shown in the bell dropdown - this app has no
    // pagination anywhere else either, so a simple cap is consistent.
    private const int MaxReturned = 50;

    private readonly INotificationRepository _notificationRepository;

    public NotificationService(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task NotifyUsersAsync(
        IEnumerable<int> userIds,
        NotificationType type,
        string title,
        string message,
        int? relatedEntityId = null)
    {
        var distinctIds = userIds.Distinct().ToList();
        if (distinctIds.Count == 0)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var notifications = distinctIds.Select(userId => new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            RelatedEntityId = relatedEntityId,
            IsRead = false,
            CreatedAt = now
        });

        await _notificationRepository.AddRangeAsync(notifications);
        await _notificationRepository.SaveChangesAsync();
    }

    public async Task<List<NotificationResponseDto>> GetMyNotificationsAsync(int currentUserId)
    {
        var items = await _notificationRepository.Query()
            .Where(n => n.UserId == currentUserId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(MaxReturned)
            .ToListAsync();

        return items.Select(MapToDto).ToList();
    }

    public async Task<UnreadCountResponseDto> GetUnreadCountAsync(int currentUserId)
    {
        var count = await _notificationRepository.Query()
            .CountAsync(n => n.UserId == currentUserId && !n.IsRead);

        return new UnreadCountResponseDto { Count = count };
    }

    public async Task MarkAsReadAsync(int id, int currentUserId)
    {
        var notification = await _notificationRepository.GetByIdAsync(id);
        if (notification == null)
        {
            throw new NotFoundException($"Notification with id {id} was not found.");
        }

        if (notification.UserId != currentUserId)
        {
            throw new ForbiddenException("You can only mark your own notifications as read.");
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            _notificationRepository.Update(notification);
            await _notificationRepository.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(int currentUserId)
    {
        var unread = await _notificationRepository.Query()
            .Where(n => n.UserId == currentUserId && !n.IsRead)
            .ToListAsync();

        if (unread.Count == 0)
        {
            return;
        }

        foreach (var notification in unread)
        {
            notification.IsRead = true;
            _notificationRepository.Update(notification);
        }

        await _notificationRepository.SaveChangesAsync();
    }

    private static NotificationResponseDto MapToDto(Notification n) => new()
    {
        Id = n.Id,
        Type = n.Type.ToString(),
        Title = n.Title,
        Message = n.Message,
        RelatedEntityId = n.RelatedEntityId,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt
    };
}
