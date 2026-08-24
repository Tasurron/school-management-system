using Microsoft.EntityFrameworkCore;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Data.Repositories.Implementations;

public class AssignmentRepository : IAssignmentRepository
{
    private readonly AppDbContext _context;

    public AssignmentRepository(AppDbContext context)
    {
        _context = context;
    }

    public IQueryable<Assignment> Query() => _context.Assignments.AsQueryable();

    public Task<Assignment?> GetByIdAsync(int id) =>
        _context.Assignments.FirstOrDefaultAsync(a => a.Id == id);

    public Task<List<Assignment>> GetAllAsync() =>
        _context.Assignments.ToListAsync();

    public async Task AddAsync(Assignment assignment) =>
        await _context.Assignments.AddAsync(assignment);

    public void Update(Assignment assignment) =>
        _context.Assignments.Update(assignment);

    public void Delete(Assignment assignment) =>
        _context.Assignments.Remove(assignment);

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();
}
