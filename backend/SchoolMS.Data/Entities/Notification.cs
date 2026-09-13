using SchoolMS.Data.Enums;

namespace SchoolMS.Data.Entities;

public class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    // Optional pointer to the entity this notification is about (usually an
    // Assignment id), so the frontend can link straight to the relevant page.
    public int? RelatedEntityId { get; set; }

    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
