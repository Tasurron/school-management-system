using SchoolMS.Data.Entities;

namespace SchoolMS.Data.Repositories.Interfaces;

public interface ITeacherSubjectClassRepository
{
    IQueryable<TeacherSubjectClass> Query();
    Task<TeacherSubjectClass?> GetByIdAsync(int id);
    Task<List<TeacherSubjectClass>> GetAllAsync();
    Task AddAsync(TeacherSubjectClass teacherSubjectClass);
    void Delete(TeacherSubjectClass teacherSubjectClass);
    Task SaveChangesAsync();
}
