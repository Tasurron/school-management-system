using SchoolMS.Data.Entities;

namespace SchoolMS.Data.Repositories.Interfaces;

public interface IClassRepository
{
    IQueryable<Class> Query();
    Task<Class?> GetByIdAsync(int id);
    Task<List<Class>> GetAllAsync();
    Task AddAsync(Class classEntity);
    void Update(Class classEntity);
    void Delete(Class classEntity);
    Task SaveChangesAsync();
}
