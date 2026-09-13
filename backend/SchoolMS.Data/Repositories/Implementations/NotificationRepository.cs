using Microsoft.EntityFrameworkCore;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Data.Repositories.Implementations;

public class NotificationRepository : INotificationRepository
{
    private readonly AppDbContext _context;

    public NotificationRepository(AppDbContext context)
    {
        _context = context;
    }

    public IQueryable<Notification> Query() => _context.Notifications.AsQueryable();

    public Task<Notification?> GetByIdAsync(int id) =>
        _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);

    public async Task AddRangeAsync(IEnumerable<Notification> notifications) =>
        await _context.Notifications.AddRangeAsync(notifications);

    public void Update(Notification notification) =>
        _context.Notifications.Update(notification);

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();
}
