using Microsoft.EntityFrameworkCore;
using SchoolMS.Business.DTOs.TeacherAssignments;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Enums;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Business.Services;

public class TeacherAssignmentService : ITeacherAssignmentService
{
    private readonly ITeacherSubjectClassRepository _teacherSubjectClassRepository;
    private readonly IUserRepository _userRepository;

    public TeacherAssignmentService(
        ITeacherSubjectClassRepository teacherSubjectClassRepository,
        IUserRepository userRepository)
    {
        _teacherSubjectClassRepository = teacherSubjectClassRepository;
        _userRepository = userRepository;
    }

    public async Task<List<TeacherAssignmentResponseDto>> GetAllAsync(int currentUserId, string currentUserRole, int? teacherIdFilter)
    {
        var query = _teacherSubjectClassRepository.Query()
            .Include(t => t.Teacher)
            .Include(t => t.Subject)
            .Include(t => t.Class)
            .AsQueryable();

        if (string.Equals(currentUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            // Teachers are always forced to their own records regardless of the query filter.
            query = query.Where(t => t.TeacherId == currentUserId);
        }
        else if (teacherIdFilter.HasValue)
        {
            query = query.Where(t => t.TeacherId == teacherIdFilter.Value);
        }

        var items = await query.OrderBy(t => t.Id).ToListAsync();
        return items.Select(MapToDto).ToList();
    }

    public async Task<TeacherAssignmentResponseDto> GetByIdAsync(int id, int currentUserId, string currentUserRole)
    {
        var item = await _teacherSubjectClassRepository.Query()
            .Include(t => t.Teacher)
            .Include(t => t.Subject)
            .Include(t => t.Class)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (item == null)
        {
            throw new NotFoundException($"Teacher assignment with id {id} was not found.");
        }

        var isAdmin = string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase);
        var isOwningTeacher = item.TeacherId == currentUserId;
        if (!isAdmin && !isOwningTeacher)
        {
            throw new ForbiddenException("You do not have access to this teacher assignment.");
        }

        return MapToDto(item);
    }

    public async Task<TeacherAssignmentResponseDto> CreateAsync(CreateTeacherAssignmentRequest request)
    {
        var teacher = await _userRepository.GetByIdAsync(request.TeacherId);
        if (teacher == null)
        {
            throw new NotFoundException($"User with id {request.TeacherId} was not found.");
        }

        if (teacher.Role != UserRole.Teacher)
        {
            throw new BusinessRuleException("The specified user is not a Teacher.");
        }

        var duplicate = await _teacherSubjectClassRepository.Query()
            .AnyAsync(t => t.TeacherId == request.TeacherId && t.SubjectId == request.SubjectId && t.ClassId == request.ClassId);
        if (duplicate)
        {
            throw new ConflictException("This teacher is already assigned to this subject for this class.");
        }

        var entity = new TeacherSubjectClass
        {
            TeacherId = request.TeacherId,
            SubjectId = request.SubjectId,
            ClassId = request.ClassId,
            CreatedAt = DateTime.UtcNow
        };

        await _teacherSubjectClassRepository.AddAsync(entity);
        await _teacherSubjectClassRepository.SaveChangesAsync();

        var created = await _teacherSubjectClassRepository.Query()
            .Include(t => t.Teacher)
            .Include(t => t.Subject)
            .Include(t => t.Class)
            .FirstAsync(t => t.Id == entity.Id);

        return MapToDto(created);
    }

    public async Task DeleteAsync(int id)
    {
        var item = await _teacherSubjectClassRepository.GetByIdAsync(id);
        if (item == null)
        {
            throw new NotFoundException($"Teacher assignment with id {id} was not found.");
        }

        _teacherSubjectClassRepository.Delete(item);
        await _teacherSubjectClassRepository.SaveChangesAsync();
    }

    private static TeacherAssignmentResponseDto MapToDto(TeacherSubjectClass entity) => new()
    {
        Id = entity.Id,
        TeacherId = entity.TeacherId,
        TeacherName = entity.Teacher.FullName,
        SubjectId = entity.SubjectId,
        SubjectName = entity.Subject.Name,
        ClassId = entity.ClassId,
        ClassName = entity.Class.Name,
        ClassGrade = entity.Class.Grade,
        ClassSection = entity.Class.Section,
        CreatedAt = entity.CreatedAt
    };
}
