using Microsoft.EntityFrameworkCore;
using SchoolMS.Business.DTOs.Submissions;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Enums;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Business.Services;

public class SubmissionService : ISubmissionService
{
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly IUserRepository _userRepository;

    public SubmissionService(
        ISubmissionRepository submissionRepository,
        IAssignmentRepository assignmentRepository,
        IUserRepository userRepository)
    {
        _submissionRepository = submissionRepository;
        _assignmentRepository = assignmentRepository;
        _userRepository = userRepository;
    }

    public async Task<List<SubmissionResponseDto>> GetAllAsync(
        int currentUserId,
        string currentUserRole,
        int? assignmentIdFilter,
        int? studentIdFilter)
    {
        var query = BaseQuery();

        if (string.Equals(currentUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => s.Assignment.TeacherId == currentUserId);
        }
        else if (string.Equals(currentUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => s.StudentId == currentUserId);
        }
        else
        {
            // Admin: optional filters.
            if (assignmentIdFilter.HasValue)
            {
                query = query.Where(s => s.AssignmentId == assignmentIdFilter.Value);
            }
            if (studentIdFilter.HasValue)
            {
                query = query.Where(s => s.StudentId == studentIdFilter.Value);
            }
        }

        var items = await query.OrderBy(s => s.Id).ToListAsync();
        return items.Select(MapToDto).ToList();
    }

    public async Task<SubmissionResponseDto> GetByIdAsync(int id, int currentUserId, string currentUserRole)
    {
        var submission = await BaseQuery().FirstOrDefaultAsync(s => s.Id == id);
        if (submission == null)
        {
            throw new NotFoundException($"Submission with id {id} was not found.");
        }

        var isAdmin = string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase);
        var isOwningStudent = submission.StudentId == currentUserId;
        var isOwningTeacher = submission.Assignment.TeacherId == currentUserId;

        if (!isAdmin && !isOwningStudent && !isOwningTeacher)
        {
            throw new ForbiddenException("You do not have access to this submission.");
        }

        return MapToDto(submission);
    }

    public async Task<SubmissionResponseDto> CreateAsync(CreateSubmissionRequest request, int currentStudentId)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(request.AssignmentId);
        if (assignment == null)
        {
            throw new NotFoundException($"Assignment with id {request.AssignmentId} was not found.");
        }

        if (assignment.Status != AssignmentStatus.Published)
        {
            throw new BusinessRuleException("This assignment is not published and cannot accept submissions.");
        }

        var student = await _userRepository.GetByIdAsync(currentStudentId);
        if (student == null || assignment.ClassId != student.ClassId)
        {
            throw new ForbiddenException("This assignment is not available to your class.");
        }

        if (DateTime.UtcNow > assignment.Deadline)
        {
            throw new BusinessRuleException("The deadline for this assignment has passed.");
        }

        var existing = await _submissionRepository.Query()
            .AnyAsync(s => s.AssignmentId == request.AssignmentId && s.StudentId == currentStudentId);
        if (existing)
        {
            throw new ConflictException("You have already submitted this assignment.");
        }

        var submission = new Submission
        {
            AssignmentId = request.AssignmentId,
            StudentId = currentStudentId,
            Content = request.Content,
            SubmittedAt = DateTime.UtcNow,
            Status = SubmissionStatus.Submitted
        };

        await _submissionRepository.AddAsync(submission);
        await _submissionRepository.SaveChangesAsync();

        var created = await BaseQuery().FirstAsync(s => s.Id == submission.Id);
        return MapToDto(created);
    }

    public async Task<SubmissionResponseDto> UpdateAsync(int id, UpdateSubmissionRequest request, int currentStudentId)
    {
        var submission = await _submissionRepository.Query()
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null)
        {
            throw new NotFoundException($"Submission with id {id} was not found.");
        }

        if (submission.StudentId != currentStudentId)
        {
            throw new ForbiddenException("You can only update your own submissions.");
        }

        if (DateTime.UtcNow > submission.Assignment.Deadline)
        {
            throw new BusinessRuleException("The deadline for this assignment has passed.");
        }

        if (submission.Status == SubmissionStatus.Graded)
        {
            throw new BusinessRuleException("This submission has already been graded and cannot be updated.");
        }

        submission.Content = request.Content;
        submission.UpdatedAt = DateTime.UtcNow;

        _submissionRepository.Update(submission);
        await _submissionRepository.SaveChangesAsync();

        var updated = await BaseQuery().FirstAsync(s => s.Id == submission.Id);
        return MapToDto(updated);
    }

    public async Task<SubmissionResponseDto> GradeAsync(int id, GradeSubmissionRequest request, int currentTeacherId)
    {
        var submission = await _submissionRepository.Query()
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null)
        {
            throw new NotFoundException($"Submission with id {id} was not found.");
        }

        if (submission.Assignment.TeacherId != currentTeacherId)
        {
            throw new ForbiddenException("You can only grade submissions for assignments you own.");
        }

        if (request.Marks < 0 || request.Marks > submission.Assignment.MaxMarks)
        {
            throw new BusinessRuleException($"Marks must be between 0 and {submission.Assignment.MaxMarks}.");
        }

        submission.Marks = request.Marks;
        submission.Feedback = request.Feedback;
        submission.Status = SubmissionStatus.Graded;
        submission.UpdatedAt = DateTime.UtcNow;

        _submissionRepository.Update(submission);
        await _submissionRepository.SaveChangesAsync();

        var updated = await BaseQuery().FirstAsync(s => s.Id == submission.Id);
        return MapToDto(updated);
    }

    private IQueryable<Submission> BaseQuery() =>
        _submissionRepository.Query()
            .Include(s => s.Assignment)
            .Include(s => s.Student);

    private static SubmissionResponseDto MapToDto(Submission s) => new()
    {
        Id = s.Id,
        AssignmentId = s.AssignmentId,
        AssignmentTitle = s.Assignment.Title,
        MaxMarks = s.Assignment.MaxMarks,
        StudentId = s.StudentId,
        StudentName = s.Student.FullName,
        Content = s.Content,
        SubmittedAt = s.SubmittedAt,
        UpdatedAt = s.UpdatedAt,
        Status = s.Status.ToString(),
        Marks = s.Marks,
        Feedback = s.Feedback
    };
}
