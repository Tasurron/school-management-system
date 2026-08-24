using SchoolMS.Data.Entities;

namespace SchoolMS.Data.Repositories.Interfaces;

public interface IUserRepository
{
    IQueryable<User> Query();
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(string email);
    Task<List<User>> GetAllAsync();
    Task AddAsync(User user);
    void Update(User user);
    Task SaveChangesAsync();
}
