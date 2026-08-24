using SchoolMS.Data.Entities;

namespace SchoolMS.Data.Repositories.Interfaces;

public interface ISubmissionRepository
{
    IQueryable<Submission> Query();
    Task<Submission?> GetByIdAsync(int id);
    Task<List<Submission>> GetAllAsync();
    Task AddAsync(Submission submission);
    void Update(Submission submission);
    Task SaveChangesAsync();
}
