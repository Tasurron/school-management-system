using SchoolMS.Data.Entities;

namespace SchoolMS.Data.Repositories.Interfaces;

public interface ISubjectRepository
{
    IQueryable<Subject> Query();
    Task<Subject?> GetByIdAsync(int id);
    Task<List<Subject>> GetAllAsync();
    Task AddAsync(Subject subject);
    void Update(Subject subject);
    void Delete(Subject subject);
    Task SaveChangesAsync();
}
