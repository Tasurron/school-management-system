using Microsoft.EntityFrameworkCore;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Data.Repositories.Implementations;

public class SubjectRepository : ISubjectRepository
{
    private readonly AppDbContext _context;

    public SubjectRepository(AppDbContext context)
    {
        _context = context;
    }

    public IQueryable<Subject> Query() => _context.Subjects.AsQueryable();

    public Task<Subject?> GetByIdAsync(int id) =>
        _context.Subjects.FirstOrDefaultAsync(s => s.Id == id);

    public Task<List<Subject>> GetAllAsync() =>
        _context.Subjects.ToListAsync();

    public async Task AddAsync(Subject subject) =>
        await _context.Subjects.AddAsync(subject);

    public void Update(Subject subject) =>
        _context.Subjects.Update(subject);

    public void Delete(Subject subject) =>
        _context.Subjects.Remove(subject);

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();
}
