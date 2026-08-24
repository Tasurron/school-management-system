using Microsoft.EntityFrameworkCore;
using SchoolMS.Business.DTOs.Assignments;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Enums;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Business.Services;

public class AssignmentService : IAssignmentService
{
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITeacherSubjectClassRepository _teacherSubjectClassRepository;

    public AssignmentService(
        IAssignmentRepository assignmentRepository,
        IUserRepository userRepository,
        ITeacherSubjectClassRepository teacherSubjectClassRepository)
    {
        _assignmentRepository = assignmentRepository;
        _userRepository = userRepository;
        _teacherSubjectClassRepository = teacherSubjectClassRepository;
    }

    public async Task<List<AssignmentResponseDto>> GetAllAsync(
        int currentUserId,
        string currentUserRole,
        int? classIdFilter,
        int? subjectIdFilter,
        int? teacherIdFilter)
    {
        var query = BaseQuery();

        if (string.Equals(currentUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(a => a.TeacherId == currentUserId);
        }
        else if (string.Equals(currentUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            var student = await _userRepository.GetByIdAsync(currentUserId);
            var studentClassId = student?.ClassId;
            query = query.Where(a => a.Status == AssignmentStatus.Published && a.ClassId == studentClassId);
        }
        else
        {
            // Admin: apply optional filters.
            if (classIdFilter.HasValue)
            {
                query = query.Where(a => a.ClassId == classIdFilter.Value);
            }
            if (subjectIdFilter.HasValue)
            {
                query = query.Where(a => a.SubjectId == subjectIdFilter.Value);
            }
            if (teacherIdFilter.HasValue)
            {
                query = query.Where(a => a.TeacherId == teacherIdFilter.Value);
            }
        }

        var items = await query.OrderBy(a => a.Id).ToListAsync();
        return items.Select(MapToDto).ToList();
    }

    public async Task<AssignmentResponseDto> GetByIdAsync(int id, int currentUserId, string currentUserRole)
    {
        var assignment = await BaseQuery().FirstOrDefaultAsync(a => a.Id == id);
        if (assignment == null)
        {
            throw new NotFoundException($"Assignment with id {id} was not found.");
        }

        if (string.Equals(currentUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            if (assignment.TeacherId != currentUserId)
            {
                throw new ForbiddenException("You do not have access to this assignment.");
            }
        }
        else if (string.Equals(currentUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            var student = await _userRepository.GetByIdAsync(currentUserId);
            var visible = assignment.Status == AssignmentStatus.Published && assignment.ClassId == student?.ClassId;
            if (!visible)
            {
                throw new ForbiddenException("You do not have access to this assignment.");
            }
        }

        return MapToDto(assignment);
    }

    public async Task<AssignmentResponseDto> CreateAsync(CreateAssignmentRequest request, int currentTeacherId)
    {
        if (request.MaxMarks <= 0)
        {
            throw new BusinessRuleException("MaxMarks must be greater than 0.");
        }

        if (request.Deadline <= DateTime.UtcNow)
        {
            throw new BusinessRuleException("Deadline must be in the future.");
        }

        var isLinked = await _teacherSubjectClassRepository.Query()
            .AnyAsync(t => t.TeacherId == currentTeacherId && t.SubjectId == request.SubjectId && t.ClassId == request.ClassId);
        if (!isLinked)
        {
            throw new ForbiddenException("You are not assigned to teach this subject for this class.");
        }

        var status = AssignmentStatus.Draft;
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (!Enum.TryParse<AssignmentStatus>(request.Status, true, out status))
            {
                throw new BusinessRuleException($"Invalid status '{request.Status}'. Must be Draft or Published.");
            }
        }

        var assignment = new Assignment
        {
            Title = request.Title,
            Description = request.Description,
            Deadline = request.Deadline,
            MaxMarks = request.MaxMarks,
            Status = status,
            ClassId = request.ClassId,
            SubjectId = request.SubjectId,
            TeacherId = currentTeacherId,
            CreatedAt = DateTime.UtcNow
        };

        await _assignmentRepository.AddAsync(assignment);
        await _assignmentRepository.SaveChangesAsync();

        var created = await BaseQuery().FirstAsync(a => a.Id == assignment.Id);
        return MapToDto(created);
    }

    public async Task<AssignmentResponseDto> UpdateAsync(int id, UpdateAssignmentRequest request, int currentTeacherId)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id);
        if (assignment == null)
        {
            throw new NotFoundException($"Assignment with id {id} was not found.");
        }

        if (assignment.TeacherId != currentTeacherId)
        {
            throw new ForbiddenException("You can only edit assignments you own.");
        }

        if (request.MaxMarks <= 0)
        {
            throw new BusinessRuleException("MaxMarks must be greater than 0.");
        }

        if (!Enum.TryParse<AssignmentStatus>(request.Status, true, out var status))
        {
            throw new BusinessRuleException($"Invalid status '{request.Status}'. Must be Draft or Published.");
        }

        assignment.Title = request.Title;
        assignment.Description = request.Description;
        assignment.Deadline = request.Deadline;
        assignment.MaxMarks = request.MaxMarks;
        assignment.Status = status;
        assignment.UpdatedAt = DateTime.UtcNow;

        _assignmentRepository.Update(assignment);
        await _assignmentRepository.SaveChangesAsync();

        var updated = await BaseQuery().FirstAsync(a => a.Id == assignment.Id);
        return MapToDto(updated);
    }

    public async Task DeleteAsync(int id, int currentTeacherId)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id);
        if (assignment == null)
        {
            throw new NotFoundException($"Assignment with id {id} was not found.");
        }

        if (assignment.TeacherId != currentTeacherId)
        {
            throw new ForbiddenException("You can only delete assignments you own.");
        }

        // Submissions cascade-delete via the FK configuration.
        _assignmentRepository.Delete(assignment);
        await _assignmentRepository.SaveChangesAsync();
    }

    private IQueryable<Assignment> BaseQuery() =>
        _assignmentRepository.Query()
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .Include(a => a.Teacher);

    private static AssignmentResponseDto MapToDto(Assignment a) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Description = a.Description,
        Deadline = a.Deadline,
        MaxMarks = a.MaxMarks,
        Status = a.Status.ToString(),
        ClassId = a.ClassId,
        ClassName = a.Class.Name,
        SubjectId = a.SubjectId,
        SubjectName = a.Subject.Name,
        TeacherId = a.TeacherId,
        TeacherName = a.Teacher.FullName,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt
    };
}
