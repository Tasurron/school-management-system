using MockQueryable.Moq;
using MockQueryable;
using Moq;
using SchoolMS.Business.DTOs.Submissions;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Business.Services;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Enums;
using SchoolMS.Data.Repositories.Interfaces;
using Xunit;

namespace SchoolMS.Tests;

public class SubmissionServiceTests
{
    private readonly Mock<ISubmissionRepository> _submissionRepositoryMock = new();
    private readonly Mock<IAssignmentRepository> _assignmentRepositoryMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<INotificationService> _notificationServiceMock = new();

    private static readonly Class TestClass = new() { Id = 10, Name = "Class 10-A" };
    private static readonly Subject TestSubject = new() { Id = 20, Name = "Mathematics" };
    private static readonly User TestTeacher = new() { Id = 30, FullName = "Teacher", Email = "t@school.com", Role = UserRole.Teacher };
    private static readonly User TestStudent = new() { Id = 40, FullName = "Student", Email = "s@school.com", Role = UserRole.Student, ClassId = TestClass.Id };

    private SubmissionService CreateService() =>
        new(_submissionRepositoryMock.Object, _assignmentRepositoryMock.Object, _userRepositoryMock.Object, _notificationServiceMock.Object);

    private static Assignment MakeAssignment(
        AssignmentStatus status = AssignmentStatus.Published,
        DateTime? deadline = null,
        int? classId = null,
        int maxMarks = 100) => new()
    {
        Id = 1,
        Title = "Homework",
        Description = "Desc",
        ClassId = classId ?? TestClass.Id,
        SubjectId = TestSubject.Id,
        TeacherId = TestTeacher.Id,
        Status = status,
        Deadline = deadline ?? DateTime.UtcNow.AddDays(3),
        MaxMarks = maxMarks,
        Class = TestClass,
        Subject = TestSubject,
        Teacher = TestTeacher
    };

    // ---------- Create ----------

    [Fact]
    public async Task CreateAsync_AfterDeadline_ThrowsBusinessRuleException()
    {
        var assignment = MakeAssignment(deadline: DateTime.UtcNow.AddDays(-1));
        _assignmentRepositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(assignment);
        _userRepositoryMock.Setup(r => r.GetByIdAsync(TestStudent.Id)).ReturnsAsync(TestStudent);

        var service = CreateService();
        var request = new CreateSubmissionRequest { AssignmentId = 1, Content = "My work" };

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.CreateAsync(request, TestStudent.Id));
    }

    [Fact]
    public async Task CreateAsync_ToDraftAssignment_ThrowsBusinessRuleException()
    {
        var assignment = MakeAssignment(status: AssignmentStatus.Draft);
        _assignmentRepositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(assignment);

        var service = CreateService();
        var request = new CreateSubmissionRequest { AssignmentId = 1, Content = "My work" };

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.CreateAsync(request, TestStudent.Id));
    }

    [Fact]
    public async Task CreateAsync_ForAssignmentInDifferentClass_ThrowsForbiddenException()
    {
        var assignment = MakeAssignment(classId: 999); // different from student's class
        _assignmentRepositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(assignment);
        _userRepositoryMock.Setup(r => r.GetByIdAsync(TestStudent.Id)).ReturnsAsync(TestStudent);

        var service = CreateService();
        var request = new CreateSubmissionRequest { AssignmentId = 1, Content = "My work" };

        await Assert.ThrowsAsync<ForbiddenException>(() => service.CreateAsync(request, TestStudent.Id));
    }

    [Fact]
    public async Task CreateAsync_Duplicate_ThrowsConflictException()
    {
        var assignment = MakeAssignment();
        _assignmentRepositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(assignment);
        _userRepositoryMock.Setup(r => r.GetByIdAsync(TestStudent.Id)).ReturnsAsync(TestStudent);

        var existingSubmission = new Submission { Id = 5, AssignmentId = 1, StudentId = TestStudent.Id, Assignment = assignment, Student = TestStudent };
        _submissionRepositoryMock.Setup(r => r.Query()).Returns(new[] { existingSubmission }.BuildMock());

        var service = CreateService();
        var request = new CreateSubmissionRequest { AssignmentId = 1, Content = "My work" };

        await Assert.ThrowsAsync<ConflictException>(() => service.CreateAsync(request, TestStudent.Id));
    }

    [Fact]
    public async Task CreateAsync_ValidSubmission_CreatesWithSubmittedStatus()
    {
        var assignment = MakeAssignment();
        _assignmentRepositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(assignment);
        _userRepositoryMock.Setup(r => r.GetByIdAsync(TestStudent.Id)).ReturnsAsync(TestStudent);

        Submission? saved = null;
        _submissionRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Submission>()))
            .Callback<Submission>(s =>
            {
                s.Assignment = assignment;
                s.Student = TestStudent;
                saved = s;
            })
            .Returns(Task.CompletedTask);

        _submissionRepositoryMock
            .Setup(r => r.Query())
            .Returns(() => saved == null ? Array.Empty<Submission>().BuildMock() : new[] { saved }.BuildMock());

        var service = CreateService();
        var result = await service.CreateAsync(new CreateSubmissionRequest { AssignmentId = 1, Content = "My work" }, TestStudent.Id);

        Assert.Equal(SubmissionStatus.Submitted.ToString(), result.Status);
        Assert.Equal("My work", result.Content);
    }

    // ---------- Update ----------

    [Fact]
    public async Task UpdateAsync_AfterDeadline_ThrowsBusinessRuleException()
    {
        var assignment = MakeAssignment(deadline: DateTime.UtcNow.AddDays(-1));
        var submission = new Submission { Id = 5, AssignmentId = 1, StudentId = TestStudent.Id, Assignment = assignment, Status = SubmissionStatus.Submitted };
        _submissionRepositoryMock.Setup(r => r.Query()).Returns(new[] { submission }.BuildMock());

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.UpdateAsync(5, new UpdateSubmissionRequest { Content = "Updated" }, TestStudent.Id));
    }

    [Fact]
    public async Task UpdateAsync_AlreadyGraded_ThrowsBusinessRuleException()
    {
        var assignment = MakeAssignment();
        var submission = new Submission { Id = 5, AssignmentId = 1, StudentId = TestStudent.Id, Assignment = assignment, Status = SubmissionStatus.Graded };
        _submissionRepositoryMock.Setup(r => r.Query()).Returns(new[] { submission }.BuildMock());

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.UpdateAsync(5, new UpdateSubmissionRequest { Content = "Updated" }, TestStudent.Id));
    }

    [Fact]
    public async Task UpdateAsync_ByNonOwnerStudent_ThrowsForbiddenException()
    {
        var assignment = MakeAssignment();
        var submission = new Submission { Id = 5, AssignmentId = 1, StudentId = TestStudent.Id, Assignment = assignment, Status = SubmissionStatus.Submitted };
        _submissionRepositoryMock.Setup(r => r.Query()).Returns(new[] { submission }.BuildMock());

        var service = CreateService();
        var otherStudentId = TestStudent.Id + 999;

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(5, new UpdateSubmissionRequest { Content = "Updated" }, otherStudentId));
    }

    [Fact]
    public async Task UpdateAsync_BeforeDeadlineAndUngraded_Succeeds()
    {
        var assignment = MakeAssignment();
        var submission = new Submission
        {
            Id = 5,
            AssignmentId = 1,
            StudentId = TestStudent.Id,
            Assignment = assignment,
            Student = TestStudent,
            Status = SubmissionStatus.Submitted,
            Content = "Old content"
        };
        _submissionRepositoryMock.Setup(r => r.Query()).Returns(new[] { submission }.BuildMock());

        var service = CreateService();
        var result = await service.UpdateAsync(5, new UpdateSubmissionRequest { Content = "New content" }, TestStudent.Id);

        Assert.Equal("New content", result.Content);
        _submissionRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    // ---------- Grade ----------

    [Fact]
    public async Task GradeAsync_MarksGreaterThanMaxMarks_ThrowsBusinessRuleException()
    {
        var assignment = MakeAssignment(maxMarks: 100);
        var submission = new Submission { Id = 5, AssignmentId = 1, StudentId = TestStudent.Id, Assignment = assignment };
        _submissionRepositoryMock.Setup(r => r.Query()).Returns(new[] { submission }.BuildMock());

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.GradeAsync(5, new GradeSubmissionRequest { Marks = 150, Feedback = "Too high" }, TestTeacher.Id));
    }

    [Fact]
    public async Task GradeAsync_NegativeMarks_ThrowsBusinessRuleException()
    {
        var assignment = MakeAssignment(maxMarks: 100);
        var submission = new Submission { Id = 5, AssignmentId = 1, StudentId = TestStudent.Id, Assignment = assignment };
        _submissionRepositoryMock.Setup(r => r.Query()).Returns(new[] { submission }.BuildMock());

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.GradeAsync(5, new GradeSubmissionRequest { Marks = -10, Feedback = "Negative" }, TestTeacher.Id));
    }

    [Fact]
    public async Task GradeAsync_ByNonOwningTeacher_ThrowsForbiddenException()
    {
        var assignment = MakeAssignment();
        var submission = new Submission { Id = 5, AssignmentId = 1, StudentId = TestStudent.Id, Assignment = assignment };
        _submissionRepositoryMock.Setup(r => r.Query()).Returns(new[] { submission }.BuildMock());

        var service = CreateService();
        var otherTeacherId = TestTeacher.Id + 999;

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.GradeAsync(5, new GradeSubmissionRequest { Marks = 50, Feedback = "Good" }, otherTeacherId));
    }

    [Fact]
    public async Task GradeAsync_ValidGrade_SetsStatusGraded()
    {
        var assignment = MakeAssignment(maxMarks: 100);
        var submission = new Submission
        {
            Id = 5,
            AssignmentId = 1,
            StudentId = TestStudent.Id,
            Assignment = assignment,
            Student = TestStudent,
            Status = SubmissionStatus.Submitted
        };
        _submissionRepositoryMock.Setup(r => r.Query()).Returns(new[] { submission }.BuildMock());

        var service = CreateService();
        var result = await service.GradeAsync(5, new GradeSubmissionRequest { Marks = 85, Feedback = "Great job" }, TestTeacher.Id);

        Assert.Equal(SubmissionStatus.Graded.ToString(), result.Status);
        Assert.Equal(85, result.Marks);
        Assert.Equal("Great job", result.Feedback);
        _submissionRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }
}
