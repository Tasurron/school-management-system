using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
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
    private static readonly long MaxAttachmentSizeBytes = 10 * 1024 * 1024; // 10 MB

    private static readonly Dictionary<string, string> AllowedAttachmentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        [".doc"] = "application/msword",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        [".pdf"] = "application/pdf",
        [".xls"] = "application/vnd.ms-excel",
        [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".gif"] = "image/gif",
        [".webp"] = "image/webp"
    };

    private static readonly int[] AllowedGrades = { 8, 9, 10, 11, 12 };
    private static readonly string[] AllowedSections = { "A", "B" };

    private readonly IAssignmentRepository _assignmentRepository;
    private readonly IUserRepository _userRepository;
    private readonly IClassRepository _classRepository;
    private readonly ISubjectRepository _subjectRepository;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly INotificationService _notificationService;
    private readonly string _attachmentsRoot;

    public AssignmentService(
        IAssignmentRepository assignmentRepository,
        IUserRepository userRepository,
        IClassRepository classRepository,
        ISubjectRepository subjectRepository,
        ISubmissionRepository submissionRepository,
        INotificationService notificationService,
        IWebHostEnvironment environment)
    {
        _assignmentRepository = assignmentRepository;
        _userRepository = userRepository;
        _classRepository = classRepository;
        _subjectRepository = subjectRepository;
        _submissionRepository = submissionRepository;
        _notificationService = notificationService;
        _attachmentsRoot = Path.Combine(environment.ContentRootPath, "uploads", "assignments");
        Directory.CreateDirectory(_attachmentsRoot);
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
        var assignment = await GetVisibleAssignmentAsync(id, currentUserId, currentUserRole);
        return MapToDto(assignment);
    }

    public async Task<AttachmentFile> GetAttachmentAsync(int id, int currentUserId, string currentUserRole)
    {
        var assignment = await GetVisibleAssignmentAsync(id, currentUserId, currentUserRole);

        if (assignment.AttachmentStoredName == null || assignment.AttachmentFileName == null)
        {
            throw new NotFoundException("This assignment has no attachment.");
        }

        var path = Path.Combine(_attachmentsRoot, assignment.AttachmentStoredName);
        if (!File.Exists(path))
        {
            throw new NotFoundException("The attachment file could not be found.");
        }

        return new AttachmentFile
        {
            Content = await File.ReadAllBytesAsync(path),
            FileName = assignment.AttachmentFileName,
            ContentType = assignment.AttachmentContentType ?? "application/octet-stream"
        };
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

        var classEntity = await FindOrCreateClassAsync(request.ClassGrade, request.ClassSection);
        await EnsureSubjectValidForGradeAsync(request.SubjectId, classEntity.Grade);

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
            ClassId = classEntity.Id,
            SubjectId = request.SubjectId,
            TeacherId = currentTeacherId,
            CreatedAt = DateTime.UtcNow
        };

        if (request.Attachment != null)
        {
            await SaveAttachmentAsync(assignment, request.Attachment);
        }

        await _assignmentRepository.AddAsync(assignment);
        await _assignmentRepository.SaveChangesAsync();

        if (assignment.Status == AssignmentStatus.Published)
        {
            await NotifyClassOfPublishedAssignmentAsync(assignment, classEntity.Name);
        }

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

        var classEntity = await FindOrCreateClassAsync(request.ClassGrade, request.ClassSection);
        await EnsureSubjectValidForGradeAsync(request.SubjectId, classEntity.Grade);

        var oldStatus = assignment.Status;
        var oldDeadline = assignment.Deadline;

        assignment.Title = request.Title;
        assignment.Description = request.Description;
        assignment.Deadline = request.Deadline;
        assignment.MaxMarks = request.MaxMarks;
        assignment.Status = status;
        assignment.ClassId = classEntity.Id;
        assignment.SubjectId = request.SubjectId;
        assignment.UpdatedAt = DateTime.UtcNow;

        if (request.Attachment != null)
        {
            DeleteAttachmentFile(assignment);
            await SaveAttachmentAsync(assignment, request.Attachment);
        }
        else if (request.RemoveAttachment)
        {
            DeleteAttachmentFile(assignment);
            assignment.AttachmentFileName = null;
            assignment.AttachmentStoredName = null;
            assignment.AttachmentContentType = null;
            assignment.AttachmentSize = null;
        }

        _assignmentRepository.Update(assignment);
        await _assignmentRepository.SaveChangesAsync();

        var wasJustPublished = oldStatus != AssignmentStatus.Published && assignment.Status == AssignmentStatus.Published;
        var deadlineChangedWhilePublished = !wasJustPublished
            && oldStatus == AssignmentStatus.Published
            && assignment.Status == AssignmentStatus.Published
            && oldDeadline != assignment.Deadline;

        if (wasJustPublished)
        {
            await NotifyClassOfPublishedAssignmentAsync(assignment, classEntity.Name);
        }
        else if (deadlineChangedWhilePublished)
        {
            var studentIds = await StudentIdsInClassAsync(assignment.ClassId);
            await _notificationService.NotifyUsersAsync(
                studentIds,
                NotificationType.AssignmentDeadlineChanged,
                "Assignment deadline changed",
                $"The deadline for '{assignment.Title}' is now {assignment.Deadline:MMM d, yyyy h:mm tt} UTC.",
                assignment.Id);
        }

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

        var affectedStudentIds = await _submissionRepository.Query()
            .Where(s => s.AssignmentId == id)
            .Select(s => s.StudentId)
            .Distinct()
            .ToListAsync();

        DeleteAttachmentFile(assignment);

        // Submissions cascade-delete via the FK configuration.
        _assignmentRepository.Delete(assignment);
        await _assignmentRepository.SaveChangesAsync();

        if (affectedStudentIds.Count > 0)
        {
            await _notificationService.NotifyUsersAsync(
                affectedStudentIds,
                NotificationType.AssignmentDeleted,
                "Assignment removed",
                $"'{assignment.Title}' has been removed by the teacher.");
        }
    }

    private async Task<List<int>> StudentIdsInClassAsync(int classId) =>
        await _userRepository.Query()
            .Where(u => u.Role == UserRole.Student && u.ClassId == classId && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

    private async Task NotifyClassOfPublishedAssignmentAsync(Assignment assignment, string className)
    {
        var studentIds = await StudentIdsInClassAsync(assignment.ClassId);
        await _notificationService.NotifyUsersAsync(
            studentIds,
            NotificationType.AssignmentPublished,
            "New assignment published",
            $"'{assignment.Title}' has been published for {className}.",
            assignment.Id);
    }

    // Looks up the Class row for a given Grade+Section, creating it on the fly if a
    // teacher is the first to use that combination (Grade 8-12 / Section A-B is a fixed,
    // always-selectable vocabulary - it should never be blocked on an Admin creating the
    // row first).
    private async Task<Class> FindOrCreateClassAsync(int grade, string section)
    {
        if (!AllowedGrades.Contains(grade))
        {
            throw new BusinessRuleException("Class must be one of: 8, 9, 10, 11, 12.");
        }

        var normalizedSection = section.Trim().ToUpperInvariant();
        if (!AllowedSections.Contains(normalizedSection))
        {
            throw new BusinessRuleException("Section must be one of: A, B.");
        }

        var existing = await _classRepository.Query()
            .FirstOrDefaultAsync(c => c.Grade == grade && c.Section == normalizedSection);
        if (existing != null)
        {
            return existing;
        }

        var newClass = new Class
        {
            Grade = grade,
            Section = normalizedSection,
            Name = $"Class {grade} - Section {normalizedSection}"
        };
        await _classRepository.AddAsync(newClass);
        await _classRepository.SaveChangesAsync();
        return newClass;
    }

    // Stops a subject/class mismatch even if someone bypasses the dropdown and
    // calls the API directly - the subject must actually be taught in that grade.
    private async Task EnsureSubjectValidForGradeAsync(int subjectId, int grade)
    {
        var isValid = await _subjectRepository.Query()
            .Where(s => s.Id == subjectId)
            .SelectMany(s => s.Grades)
            .AnyAsync(g => g.Grade == grade);

        if (!isValid)
        {
            throw new BusinessRuleException("This subject is not available for the selected class.");
        }
    }

    private async Task<Assignment> GetVisibleAssignmentAsync(int id, int currentUserId, string currentUserRole)
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

        return assignment;
    }

    private async Task SaveAttachmentAsync(Assignment assignment, IFormFile file)
    {
        if (file.Length <= 0)
        {
            throw new BusinessRuleException("The attached file is empty.");
        }

        if (file.Length > MaxAttachmentSizeBytes)
        {
            throw new BusinessRuleException("The attached file must be 10 MB or smaller.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(extension) || !AllowedAttachmentExtensions.ContainsKey(extension))
        {
            throw new BusinessRuleException(
                "Unsupported file type. Allowed: Word (.doc, .docx), PDF, Excel (.xls, .xlsx), and images (.jpg, .jpeg, .png, .gif, .webp).");
        }

        var storedName = $"{Guid.NewGuid()}{extension}";
        var path = Path.Combine(_attachmentsRoot, storedName);

        using (var stream = new FileStream(path, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        assignment.AttachmentFileName = Path.GetFileName(file.FileName);
        assignment.AttachmentStoredName = storedName;
        assignment.AttachmentContentType = AllowedAttachmentExtensions[extension];
        assignment.AttachmentSize = file.Length;
    }

    private void DeleteAttachmentFile(Assignment assignment)
    {
        if (assignment.AttachmentStoredName == null)
        {
            return;
        }

        var path = Path.Combine(_attachmentsRoot, assignment.AttachmentStoredName);
        if (File.Exists(path))
        {
            File.Delete(path);
        }
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
        ClassGrade = a.Class.Grade,
        ClassSection = a.Class.Section,
        SubjectId = a.SubjectId,
        SubjectName = a.Subject.Name,
        TeacherId = a.TeacherId,
        TeacherName = a.Teacher.FullName,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt,
        AttachmentFileName = a.AttachmentFileName
    };
}
