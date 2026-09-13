using Microsoft.AspNetCore.Hosting;
using MockQueryable.Moq;
using MockQueryable;
using Moq;
using SchoolMS.Business.DTOs.Assignments;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Business.Services;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Enums;
using SchoolMS.Data.Repositories.Interfaces;
using Xunit;

namespace SchoolMS.Tests;

public class AssignmentServiceTests
{
    private readonly Mock<IAssignmentRepository> _assignmentRepositoryMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IClassRepository> _classRepositoryMock = new();
    private readonly Mock<ISubjectRepository> _subjectRepositoryMock = new();
    private readonly Mock<ISubmissionRepository> _submissionRepositoryMock = new();
    private readonly Mock<INotificationService> _notificationServiceMock = new();
    private readonly Mock<IWebHostEnvironment> _environmentMock = new();

    private static readonly Class TestClass = new() { Id = 10, Grade = 10, Section = "A", Name = "Class 10 - Section A" };
    private static readonly Subject TestSubject = new()
    {
        Id = 20,
        Name = "Mathematics",
        Grades = new List<SubjectGrade> { new() { Grade = 10 } }
    };
    private static readonly User TestTeacher = new() { Id = 30, FullName = "Mr. Teacher", Email = "t@school.com", Role = UserRole.Teacher };

    private AssignmentService CreateService()
    {
        _environmentMock.Setup(e => e.ContentRootPath).Returns(Path.GetTempPath());
        // Default: the (Grade, Section) used by ValidCreateRequest() already exists,
        // and TestSubject is already valid for TestClass.Grade.
        _classRepositoryMock.Setup(r => r.Query()).Returns(new[] { TestClass }.BuildMock());
        _subjectRepositoryMock.Setup(r => r.Query()).Returns(new[] { TestSubject }.BuildMock());
        // Default: no students in the class, so publish/deadline-change notifications are no-ops.
        _userRepositoryMock.Setup(r => r.Query()).Returns(Array.Empty<User>().BuildMock());
        _submissionRepositoryMock.Setup(r => r.Query()).Returns(Array.Empty<Submission>().BuildMock());
        return new(
            _assignmentRepositoryMock.Object,
            _userRepositoryMock.Object,
            _classRepositoryMock.Object,
            _subjectRepositoryMock.Object,
            _submissionRepositoryMock.Object,
            _notificationServiceMock.Object,
            _environmentMock.Object);
    }

    private void SetupAddCapture(out Func<Assignment?> getSaved)
    {
        Assignment? saved = null;
        _assignmentRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Assignment>()))
            .Callback<Assignment>(a =>
            {
                a.Class = TestClass;
                a.Subject = TestSubject;
                a.Teacher = TestTeacher;
                saved = a;
            })
            .Returns(Task.CompletedTask);

        _assignmentRepositoryMock
            .Setup(r => r.Query())
            .Returns(() => saved == null ? Array.Empty<Assignment>().BuildMock() : new[] { saved }.BuildMock());

        getSaved = () => saved;
    }

    private CreateAssignmentRequest ValidCreateRequest() => new()
    {
        Title = "Algebra Homework",
        Description = "Solve problems 1-10",
        Deadline = DateTime.UtcNow.AddDays(5),
        MaxMarks = 100,
        ClassGrade = TestClass.Grade,
        ClassSection = TestClass.Section,
        SubjectId = TestSubject.Id
    };

    [Fact]
    public async Task CreateAsync_WithMaxMarksZeroOrLess_ThrowsBusinessRuleException()
    {
        var request = ValidCreateRequest();
        request.MaxMarks = 0;

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.CreateAsync(request, TestTeacher.Id));
    }

    [Fact]
    public async Task CreateAsync_WithDeadlineInThePast_ThrowsBusinessRuleException()
    {
        var request = ValidCreateRequest();
        request.Deadline = DateTime.UtcNow.AddDays(-1);

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.CreateAsync(request, TestTeacher.Id));
    }

    [Fact]
    public async Task CreateAsync_WithInvalidGrade_ThrowsBusinessRuleException()
    {
        var request = ValidCreateRequest();
        request.ClassGrade = 7;

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.CreateAsync(request, TestTeacher.Id));
    }

    [Fact]
    public async Task CreateAsync_WithInvalidSection_ThrowsBusinessRuleException()
    {
        var request = ValidCreateRequest();
        request.ClassSection = "C";

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.CreateAsync(request, TestTeacher.Id));
    }

    [Fact]
    public async Task CreateAsync_WhenSubjectNotOfferedForGrade_ThrowsBusinessRuleException()
    {
        // TestSubject is only mapped to grade 10; request a different grade.
        var request = ValidCreateRequest();
        request.ClassGrade = 8;
        request.ClassSection = "A";

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.CreateAsync(request, TestTeacher.Id));
    }

    [Fact]
    public async Task CreateAsync_WhenClassDoesNotExistYet_CreatesItAutomatically()
    {
        _classRepositoryMock.Setup(r => r.Query()).Returns(Array.Empty<Class>().BuildMock());
        Class? createdClass = null;
        _classRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Class>()))
            .Callback<Class>(c => createdClass = c)
            .Returns(Task.CompletedTask);

        SetupAddCapture(out _);

        var service = CreateService();
        // Re-apply the empty Query() setup since CreateService() also sets a default.
        _classRepositoryMock.Setup(r => r.Query()).Returns(Array.Empty<Class>().BuildMock());

        await service.CreateAsync(ValidCreateRequest(), TestTeacher.Id);

        Assert.NotNull(createdClass);
        Assert.Equal(TestClass.Grade, createdClass!.Grade);
        Assert.Equal(TestClass.Section, createdClass.Section);
        Assert.Equal("Class 10 - Section A", createdClass.Name);
    }

    [Fact]
    public async Task CreateAsync_WithValidRequestAndNoStatus_DefaultsToDraft()
    {
        SetupAddCapture(out var getSaved);

        var service = CreateService();
        var result = await service.CreateAsync(ValidCreateRequest(), TestTeacher.Id);

        Assert.Equal(AssignmentStatus.Draft.ToString(), result.Status);
        Assert.NotNull(getSaved());
        Assert.Equal(AssignmentStatus.Draft, getSaved()!.Status);
    }

    [Fact]
    public async Task UpdateAsync_ByNonOwnerTeacher_ThrowsForbiddenException()
    {
        var assignment = new Assignment
        {
            Id = 1,
            TeacherId = TestTeacher.Id,
            ClassId = TestClass.Id,
            SubjectId = TestSubject.Id,
            Title = "Original",
            Description = "Desc",
            Deadline = DateTime.UtcNow.AddDays(3),
            MaxMarks = 50,
            Status = AssignmentStatus.Draft
        };
        _assignmentRepositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(assignment);

        var service = CreateService();
        var request = new UpdateAssignmentRequest
        {
            Title = "Updated",
            Description = "New Desc",
            Deadline = DateTime.UtcNow.AddDays(10),
            MaxMarks = 60,
            ClassGrade = TestClass.Grade,
            ClassSection = TestClass.Section,
            SubjectId = TestSubject.Id,
            Status = "Draft"
        };

        var nonOwnerTeacherId = TestTeacher.Id + 999;
        await Assert.ThrowsAsync<ForbiddenException>(() => service.UpdateAsync(1, request, nonOwnerTeacherId));
    }

    [Fact]
    public async Task DeleteAsync_ByNonOwnerTeacher_ThrowsForbiddenException()
    {
        var assignment = new Assignment { Id = 1, TeacherId = TestTeacher.Id };
        _assignmentRepositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(assignment);

        var service = CreateService();
        var nonOwnerTeacherId = TestTeacher.Id + 999;

        await Assert.ThrowsAsync<ForbiddenException>(() => service.DeleteAsync(1, nonOwnerTeacherId));
        _assignmentRepositoryMock.Verify(r => r.Delete(It.IsAny<Assignment>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_ByOwnerTeacher_Succeeds()
    {
        var assignment = new Assignment
        {
            Id = 1,
            TeacherId = TestTeacher.Id,
            ClassId = TestClass.Id,
            SubjectId = TestSubject.Id,
            Class = TestClass,
            Subject = TestSubject,
            Teacher = TestTeacher,
            Title = "Original",
            Description = "Desc",
            Deadline = DateTime.UtcNow.AddDays(3),
            MaxMarks = 50,
            Status = AssignmentStatus.Draft
        };
        _assignmentRepositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(assignment);
        _assignmentRepositoryMock.Setup(r => r.Query()).Returns(new[] { assignment }.BuildMock());

        var service = CreateService();
        var request = new UpdateAssignmentRequest
        {
            Title = "Updated Title",
            Description = "Updated Desc",
            Deadline = DateTime.UtcNow.AddDays(15),
            MaxMarks = 75,
            ClassGrade = TestClass.Grade,
            ClassSection = TestClass.Section,
            SubjectId = TestSubject.Id,
            Status = "Published"
        };

        var result = await service.UpdateAsync(1, request, TestTeacher.Id);

        Assert.Equal("Updated Title", result.Title);
        Assert.Equal("Published", result.Status);
        _assignmentRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task GetAllAsync_ForStudent_ReturnsOnlyPublishedAssignmentsForTheirClass()
    {
        var otherClass = new Class { Id = 99, Name = "Class 9-B" };
        var assignments = new[]
        {
            new Assignment { Id = 1, ClassId = TestClass.Id, Status = AssignmentStatus.Published, Class = TestClass, Subject = TestSubject, Teacher = TestTeacher },
            new Assignment { Id = 2, ClassId = TestClass.Id, Status = AssignmentStatus.Draft, Class = TestClass, Subject = TestSubject, Teacher = TestTeacher },
            new Assignment { Id = 3, ClassId = otherClass.Id, Status = AssignmentStatus.Published, Class = otherClass, Subject = TestSubject, Teacher = TestTeacher }
        };
        _assignmentRepositoryMock.Setup(r => r.Query()).Returns(assignments.BuildMock());

        var student = new User { Id = 50, Role = UserRole.Student, ClassId = TestClass.Id, FullName = "Student", Email = "s@school.com" };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(50)).ReturnsAsync(student);

        var service = CreateService();
        var result = await service.GetAllAsync(50, "Student", null, null, null);

        var resultId = Assert.Single(result);
        Assert.Equal(1, resultId.Id);
    }

    [Fact]
    public async Task GetAllAsync_ForTeacher_ReturnsOnlyOwnAssignments()
    {
        var otherTeacher = new User { Id = 31, FullName = "Other", Email = "o@school.com", Role = UserRole.Teacher };
        var assignments = new[]
        {
            new Assignment { Id = 1, TeacherId = TestTeacher.Id, Class = TestClass, Subject = TestSubject, Teacher = TestTeacher },
            new Assignment { Id = 2, TeacherId = otherTeacher.Id, Class = TestClass, Subject = TestSubject, Teacher = otherTeacher }
        };
        _assignmentRepositoryMock.Setup(r => r.Query()).Returns(assignments.BuildMock());

        var service = CreateService();
        var result = await service.GetAllAsync(TestTeacher.Id, "Teacher", null, null, null);

        var single = Assert.Single(result);
        Assert.Equal(1, single.Id);
    }
}
