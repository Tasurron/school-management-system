using Microsoft.EntityFrameworkCore;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Data.Repositories.Implementations;

public class SubmissionRepository : ISubmissionRepository
{
    private readonly AppDbContext _context;

    public SubmissionRepository(AppDbContext context)
    {
        _context = context;
    }

    public IQueryable<Submission> Query() => _context.Submissions.AsQueryable();

    public Task<Submission?> GetByIdAsync(int id) =>
        _context.Submissions.FirstOrDefaultAsync(s => s.Id == id);

    public Task<List<Submission>> GetAllAsync() =>
        _context.Submissions.ToListAsync();

    public async Task AddAsync(Submission submission) =>
        await _context.Submissions.AddAsync(submission);

    public void Update(Submission submission) =>
        _context.Submissions.Update(submission);

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();
}
