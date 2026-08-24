using SchoolMS.Data.Entities;

namespace SchoolMS.Data.Repositories.Interfaces;

public interface IAssignmentRepository
{
    IQueryable<Assignment> Query();
    Task<Assignment?> GetByIdAsync(int id);
    Task<List<Assignment>> GetAllAsync();
    Task AddAsync(Assignment assignment);
    void Update(Assignment assignment);
    void Delete(Assignment assignment);
    Task SaveChangesAsync();
}
