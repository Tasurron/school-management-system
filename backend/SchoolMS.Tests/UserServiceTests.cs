using Microsoft.AspNetCore.Identity;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using SchoolMS.Business.DTOs.Users;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Business.Services;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Enums;
using SchoolMS.Data.Repositories.Interfaces;
using Xunit;

namespace SchoolMS.Tests;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IPasswordHasher<User>> _passwordHasherMock = new();
    private readonly Mock<INotificationService> _notificationServiceMock = new();

    private static readonly User TestAdmin = new() { Id = 900, FullName = "Admin", Email = "admin@school.com", Role = UserRole.Admin };

    private UserService CreateService()
    {
        _userRepositoryMock.Setup(r => r.Query()).Returns(new[] { TestAdmin }.BuildMock());
        return new(_userRepositoryMock.Object, _passwordHasherMock.Object, _notificationServiceMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateEmail_ThrowsConflictException()
    {
        var existing = new User { Id = 1, Email = "taken@school.com", FullName = "Existing", Role = UserRole.Admin };
        _userRepositoryMock.Setup(r => r.GetByEmailAsync("taken@school.com")).ReturnsAsync(existing);

        var service = CreateService();
        var request = new CreateUserRequest
        {
            FullName = "New Person",
            Email = "taken@school.com",
            Password = "Password123",
            Role = "Teacher"
        };

        await Assert.ThrowsAsync<ConflictException>(() => service.CreateAsync(request, TestAdmin.Id));

        _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_HashesPasswordBeforeSaving()
    {
        // Constructed first so the dynamic Query() setup below (which the service
        // also relies on for the "notify other admins" lookup) is the one Moq keeps.
        var service = CreateService();

        _userRepositoryMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        User? savedUser = null;
        _userRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<User>()))
            .Callback<User>(u => savedUser = u)
            .Returns(Task.CompletedTask);

        _passwordHasherMock
            .Setup(h => h.HashPassword(It.IsAny<User>(), "PlainTextPassword1"))
            .Returns("this-is-a-hashed-value");

        // After creation, GetByIdAsync is called internally to build the response DTO.
        _userRepositoryMock
            .Setup(r => r.Query())
            .Returns(() => savedUser == null ? Array.Empty<User>().BuildMock() : new[] { savedUser }.BuildMock());

        var request = new CreateUserRequest
        {
            FullName = "Jane Teacher",
            Email = "jane@school.com",
            Password = "PlainTextPassword1",
            Role = "Teacher"
        };

        await service.CreateAsync(request, TestAdmin.Id);

        Assert.NotNull(savedUser);
        Assert.Equal("this-is-a-hashed-value", savedUser!.PasswordHash);
        Assert.NotEqual("PlainTextPassword1", savedUser.PasswordHash);
    }

    [Fact]
    public async Task DeactivateAsync_SetsIsActiveFalse()
    {
        var user = new User { Id = 3, Email = "x@school.com", FullName = "X", Role = UserRole.Student, IsActive = true };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(user);

        var service = CreateService();
        await service.DeactivateAsync(3, TestAdmin.Id);

        Assert.False(user.IsActive);
        _userRepositoryMock.Verify(r => r.Update(user), Times.Once);
        _userRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }
}
