using SchoolMS.Data.Entities;

namespace SchoolMS.Data.Repositories.Interfaces;

public interface INotificationRepository
{
    IQueryable<Notification> Query();
    Task<Notification?> GetByIdAsync(int id);
    Task AddRangeAsync(IEnumerable<Notification> notifications);
    void Update(Notification notification);
    Task SaveChangesAsync();
}
