using MockQueryable;
using MockQueryable.Moq;
using Moq;
using SchoolMS.Business.DTOs.Subjects;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Business.Services;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Enums;
using SchoolMS.Data.Repositories.Interfaces;
using Xunit;

namespace SchoolMS.Tests;

public class SubjectServiceTests
{
    private readonly Mock<ISubjectRepository> _subjectRepositoryMock = new();
    private readonly Mock<ITeacherSubjectClassRepository> _teacherSubjectClassRepositoryMock = new();
    private readonly Mock<IAssignmentRepository> _assignmentRepositoryMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<INotificationService> _notificationServiceMock = new();

    private const int CurrentAdminId = 900;

    private SubjectService CreateService()
    {
        _userRepositoryMock.Setup(r => r.Query()).Returns(Array.Empty<User>().BuildMock());
        return new(
            _subjectRepositoryMock.Object,
            _teacherSubjectClassRepositoryMock.Object,
            _assignmentRepositoryMock.Object,
            _userRepositoryMock.Object,
            _notificationServiceMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WithInvalidGrade_ThrowsBusinessRuleException()
    {
        _subjectRepositoryMock.Setup(r => r.Query()).Returns(Array.Empty<Subject>().BuildMock());

        var service = CreateService();
        var request = new SubjectRequest { Name = "Test Subject", ApplicableGrades = new List<int> { 7 } };

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.CreateAsync(request, CurrentAdminId));
    }

    [Fact]
    public async Task CreateAsync_WithValidGrades_SavesOneSubjectGradePerGrade()
    {
        _subjectRepositoryMock.Setup(r => r.Query()).Returns(Array.Empty<Subject>().BuildMock());

        Subject? saved = null;
        _subjectRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Subject>()))
            .Callback<Subject>(s => saved = s)
            .Returns(Task.CompletedTask);

        var service = CreateService();
        var request = new SubjectRequest { Name = "Physics", ApplicableGrades = new List<int> { 9, 10, 11, 12 } };

        var result = await service.CreateAsync(request, CurrentAdminId);

        Assert.NotNull(saved);
        Assert.Equal(4, saved!.Grades.Count);
        Assert.Equal(new[] { 9, 10, 11, 12 }, result.ApplicableGrades);
    }

    [Fact]
    public async Task UpdateAsync_ReplacesGradesWithTheNewSet()
    {
        var subject = new Subject
        {
            Id = 1,
            Name = "Physics",
            Grades = new List<SubjectGrade> { new() { Grade = 9 }, new() { Grade = 10 } }
        };
        _subjectRepositoryMock.Setup(r => r.Query()).Returns(new[] { subject }.BuildMock());

        var service = CreateService();
        var request = new SubjectRequest { Name = "Physics", ApplicableGrades = new List<int> { 11, 12 } };

        var result = await service.UpdateAsync(1, request, CurrentAdminId);

        Assert.Equal(new[] { 11, 12 }, result.ApplicableGrades);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateName_ThrowsConflictException()
    {
        var existing = new Subject { Id = 1, Name = "Physics" };
        _subjectRepositoryMock.Setup(r => r.Query()).Returns(new[] { existing }.BuildMock());

        var service = CreateService();
        var request = new SubjectRequest { Name = "Physics", ApplicableGrades = new List<int>() };

        await Assert.ThrowsAsync<ConflictException>(() => service.CreateAsync(request, CurrentAdminId));
    }
}
