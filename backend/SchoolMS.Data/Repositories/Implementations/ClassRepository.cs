using Microsoft.EntityFrameworkCore;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Data.Repositories.Implementations;

public class ClassRepository : IClassRepository
{
    private readonly AppDbContext _context;

    public ClassRepository(AppDbContext context)
    {
        _context = context;
    }

    public IQueryable<Class> Query() => _context.Classes.AsQueryable();

    public Task<Class?> GetByIdAsync(int id) =>
        _context.Classes.FirstOrDefaultAsync(c => c.Id == id);

    public Task<List<Class>> GetAllAsync() =>
        _context.Classes.ToListAsync();

    public async Task AddAsync(Class classEntity) =>
        await _context.Classes.AddAsync(classEntity);

    public void Update(Class classEntity) =>
        _context.Classes.Update(classEntity);

    public void Delete(Class classEntity) =>
        _context.Classes.Remove(classEntity);

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();
}
