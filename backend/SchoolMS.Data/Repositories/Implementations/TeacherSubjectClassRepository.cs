using Microsoft.EntityFrameworkCore;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Data.Repositories.Implementations;

public class TeacherSubjectClassRepository : ITeacherSubjectClassRepository
{
    private readonly AppDbContext _context;

    public TeacherSubjectClassRepository(AppDbContext context)
    {
        _context = context;
    }

    public IQueryable<TeacherSubjectClass> Query() => _context.TeacherSubjectClasses.AsQueryable();

    public Task<TeacherSubjectClass?> GetByIdAsync(int id) =>
        _context.TeacherSubjectClasses.FirstOrDefaultAsync(t => t.Id == id);

    public Task<List<TeacherSubjectClass>> GetAllAsync() =>
        _context.TeacherSubjectClasses.ToListAsync();

    public async Task AddAsync(TeacherSubjectClass teacherSubjectClass) =>
        await _context.TeacherSubjectClasses.AddAsync(teacherSubjectClass);

    public void Delete(TeacherSubjectClass teacherSubjectClass) =>
        _context.TeacherSubjectClasses.Remove(teacherSubjectClass);

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();
}
