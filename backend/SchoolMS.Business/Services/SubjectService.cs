using Microsoft.EntityFrameworkCore;
using SchoolMS.Business.DTOs.Subjects;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Business.Services;

public class SubjectService : ISubjectService
{
    private static readonly int[] AllowedGrades = { 8, 9, 10, 11, 12 };

    private readonly ISubjectRepository _subjectRepository;
    private readonly ITeacherSubjectClassRepository _teacherSubjectClassRepository;
    private readonly IAssignmentRepository _assignmentRepository;

    public SubjectService(
        ISubjectRepository subjectRepository,
        ITeacherSubjectClassRepository teacherSubjectClassRepository,
        IAssignmentRepository assignmentRepository)
    {
        _subjectRepository = subjectRepository;
        _teacherSubjectClassRepository = teacherSubjectClassRepository;
        _assignmentRepository = assignmentRepository;
    }

    public async Task<List<SubjectResponseDto>> GetAllAsync()
    {
        var subjects = await _subjectRepository.Query().Include(s => s.Grades).OrderBy(s => s.Id).ToListAsync();
        return subjects.Select(MapToDto).ToList();
    }

    public async Task<SubjectResponseDto> GetByIdAsync(int id)
    {
        var subject = await _subjectRepository.Query().Include(s => s.Grades).FirstOrDefaultAsync(s => s.Id == id);
        if (subject == null)
        {
            throw new NotFoundException($"Subject with id {id} was not found.");
        }

        return MapToDto(subject);
    }

    public async Task<SubjectResponseDto> CreateAsync(SubjectRequest request)
    {
        var duplicate = await _subjectRepository.Query().AnyAsync(s => s.Name == request.Name);
        if (duplicate)
        {
            throw new ConflictException($"A subject named '{request.Name}' already exists.");
        }

        var grades = ValidateAndNormalizeGrades(request.ApplicableGrades);

        var subject = new Subject { Name = request.Name, Code = request.Code };
        subject.Grades = grades.Select(g => new SubjectGrade { Grade = g }).ToList();

        await _subjectRepository.AddAsync(subject);
        await _subjectRepository.SaveChangesAsync();

        return MapToDto(subject);
    }

    public async Task<SubjectResponseDto> UpdateAsync(int id, SubjectRequest request)
    {
        var subject = await _subjectRepository.Query().Include(s => s.Grades).FirstOrDefaultAsync(s => s.Id == id);
        if (subject == null)
        {
            throw new NotFoundException($"Subject with id {id} was not found.");
        }

        var duplicate = await _subjectRepository.Query().AnyAsync(s => s.Name == request.Name && s.Id != id);
        if (duplicate)
        {
            throw new ConflictException($"A subject named '{request.Name}' already exists.");
        }

        var grades = ValidateAndNormalizeGrades(request.ApplicableGrades);

        subject.Name = request.Name;
        subject.Code = request.Code;

        // Simplest approach for a small list: replace the whole set of grades.
        subject.Grades.Clear();
        foreach (var grade in grades)
        {
            subject.Grades.Add(new SubjectGrade { Grade = grade });
        }

        _subjectRepository.Update(subject);
        await _subjectRepository.SaveChangesAsync();

        return MapToDto(subject);
    }

    public async Task DeleteAsync(int id)
    {
        var subject = await _subjectRepository.GetByIdAsync(id);
        if (subject == null)
        {
            throw new NotFoundException($"Subject with id {id} was not found.");
        }

        var referencedByTeacherAssignment = await _teacherSubjectClassRepository.Query().AnyAsync(t => t.SubjectId == id);
        var referencedByAssignment = await _assignmentRepository.Query().AnyAsync(a => a.SubjectId == id);
        if (referencedByTeacherAssignment || referencedByAssignment)
        {
            throw new ConflictException("This subject cannot be deleted because it is referenced by existing teacher assignments or assignments.");
        }

        _subjectRepository.Delete(subject);
        await _subjectRepository.SaveChangesAsync();
    }

    private static List<int> ValidateAndNormalizeGrades(List<int> grades)
    {
        var distinct = grades.Distinct().ToList();
        foreach (var grade in distinct)
        {
            if (!AllowedGrades.Contains(grade))
            {
                throw new BusinessRuleException("Each grade must be one of: 8, 9, 10, 11, 12.");
            }
        }
        return distinct;
    }

    private static SubjectResponseDto MapToDto(Subject subject) => new()
    {
        Id = subject.Id,
        Name = subject.Name,
        Code = subject.Code,
        ApplicableGrades = subject.Grades.Select(g => g.Grade).OrderBy(g => g).ToList()
    };
}
