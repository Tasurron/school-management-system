using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using SchoolMS.Business.Common;
using SchoolMS.Business.DTOs.Auth;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Business.Services;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Enums;
using SchoolMS.Data.Repositories.Interfaces;
using Xunit;

namespace SchoolMS.Tests;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IClassRepository> _classRepositoryMock = new();
    private readonly Mock<IPasswordHasher<User>> _passwordHasherMock = new();
    private readonly Mock<INotificationService> _notificationServiceMock = new();
    private readonly Mock<IEmailService> _emailServiceMock = new();
    private readonly JwtSettings _jwtSettings = new()
    {
        Key = "UnitTestOnlySecretKeyThatIsLongEnough123!",
        Issuer = "SchoolMS.Tests",
        Audience = "SchoolMS.Tests.Client",
        ExpiryMinutes = 60
    };

    private AuthService CreateService()
    {
        var options = Options.Create(_jwtSettings);
        _passwordHasherMock
            .Setup(h => h.HashPassword(It.IsAny<User>(), It.IsAny<string>()))
            .Returns("hashed-password");
        // Default: no admins to notify on self-registration.
        _userRepositoryMock.Setup(r => r.Query()).Returns(Array.Empty<User>().BuildMock());
        return new AuthService(
            _userRepositoryMock.Object,
            _classRepositoryMock.Object,
            _passwordHasherMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            options);
    }

    private static User MakeUser(UserRole role, bool isActive = true, int? classId = null) => new()
    {
        Id = 1,
        FullName = "Test User",
        Email = "user@school.com",
        PasswordHash = "hashed-password",
        Role = role,
        ClassId = classId,
        IsActive = isActive,
        CreatedAt = DateTime.UtcNow
    };

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsTokenAndUser()
    {
        var user = MakeUser(UserRole.Admin);
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
        _passwordHasherMock
            .Setup(h => h.VerifyHashedPassword(user, user.PasswordHash, "correct-password"))
            .Returns(PasswordVerificationResult.Success);

        var service = CreateService();
        var result = await service.LoginAsync(new LoginRequest { Email = user.Email, Password = "correct-password" });

        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal(user.Id, result.User.Id);
        Assert.Equal(user.Email, result.User.Email);
        Assert.Equal("Admin", result.User.Role);
        Assert.True(result.ExpiresAt > DateTime.UtcNow);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ThrowsUnauthorized()
    {
        var user = MakeUser(UserRole.Teacher);
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
        _passwordHasherMock
            .Setup(h => h.VerifyHashedPassword(user, user.PasswordHash, "wrong-password"))
            .Returns(PasswordVerificationResult.Failed);

        var service = CreateService();

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            service.LoginAsync(new LoginRequest { Email = user.Email, Password = "wrong-password" }));
    }

    [Fact]
    public async Task LoginAsync_WithUnknownEmail_ThrowsUnauthorized()
    {
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        var service = CreateService();

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            service.LoginAsync(new LoginRequest { Email = "unknown@school.com", Password = "whatever" }));
    }

    [Fact]
    public async Task LoginAsync_WithInactiveUser_ThrowsUnauthorized()
    {
        var user = MakeUser(UserRole.Student, isActive: false);
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

        var service = CreateService();

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            service.LoginAsync(new LoginRequest { Email = user.Email, Password = "any-password" }));

        // Password should never even be checked for an inactive account.
        _passwordHasherMock.Verify(
            h => h.VerifyHashedPassword(It.IsAny<User>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    [Theory]
    [InlineData(UserRole.Admin)]
    [InlineData(UserRole.Teacher)]
    [InlineData(UserRole.Student)]
    public async Task LoginAsync_TokenContainsCorrectRoleClaim(UserRole role)
    {
        var user = MakeUser(role, classId: role == UserRole.Student ? 5 : null);
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
        _passwordHasherMock
            .Setup(h => h.VerifyHashedPassword(user, user.PasswordHash, "password"))
            .Returns(PasswordVerificationResult.Success);

        var service = CreateService();
        var result = await service.LoginAsync(new LoginRequest { Email = user.Email, Password = "password" });

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);
        var roleClaim = jwt.Claims.First(c => c.Type == ClaimTypes.Role);
        Assert.Equal(role.ToString(), roleClaim.Value);
    }

    [Fact]
    public async Task LoginAsync_ForStudent_TokenContainsClassIdClaim()
    {
        var user = MakeUser(UserRole.Student, classId: 7);
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
        _passwordHasherMock
            .Setup(h => h.VerifyHashedPassword(user, user.PasswordHash, "password"))
            .Returns(PasswordVerificationResult.Success);

        var service = CreateService();
        var result = await service.LoginAsync(new LoginRequest { Email = user.Email, Password = "password" });

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);
        var classIdClaim = jwt.Claims.FirstOrDefault(c => c.Type == "classId");
        Assert.NotNull(classIdClaim);
        Assert.Equal("7", classIdClaim!.Value);
    }

    [Theory]
    [InlineData(UserRole.Admin)]
    [InlineData(UserRole.Teacher)]
    public async Task LoginAsync_ForNonStudent_TokenDoesNotContainClassIdClaim(UserRole role)
    {
        var user = MakeUser(role);
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
        _passwordHasherMock
            .Setup(h => h.VerifyHashedPassword(user, user.PasswordHash, "password"))
            .Returns(PasswordVerificationResult.Success);

        var service = CreateService();
        var result = await service.LoginAsync(new LoginRequest { Email = user.Email, Password = "password" });

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);
        Assert.DoesNotContain(jwt.Claims, c => c.Type == "classId");
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateEmail_ThrowsConflict()
    {
        var existing = MakeUser(UserRole.Teacher);
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(existing.Email)).ReturnsAsync(existing);

        var service = CreateService();

        await Assert.ThrowsAsync<ConflictException>(() => service.RegisterAsync(new RegisterRequest
        {
            FullName = "New Teacher",
            Email = existing.Email,
            Password = "password123",
            Role = "Teacher"
        }));
    }

    [Fact]
    public async Task RegisterAsync_WithInvalidRole_ThrowsBusinessRuleException()
    {
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.RegisterAsync(new RegisterRequest
        {
            FullName = "Someone",
            Email = "someone@school.com",
            Password = "password123",
            Role = "SuperUser"
        }));
    }

    [Fact]
    public async Task RegisterAsync_AsStudentWithoutClassId_ThrowsBusinessRuleException()
    {
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.RegisterAsync(new RegisterRequest
        {
            FullName = "New Student",
            Email = "newstudent@school.com",
            Password = "password123",
            Role = "Student",
            ClassId = null
        }));
    }

    [Fact]
    public async Task RegisterAsync_AsStudentWithNonExistentClassId_ThrowsNotFound()
    {
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _classRepositoryMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Class?)null);

        var service = CreateService();

        await Assert.ThrowsAsync<NotFoundException>(() => service.RegisterAsync(new RegisterRequest
        {
            FullName = "New Student",
            Email = "newstudent@school.com",
            Password = "password123",
            Role = "Student",
            ClassId = 999
        }));
    }

    [Fact]
    public async Task RegisterAsync_WithValidData_CreatesActiveUserAndReturnsToken()
    {
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        User? savedUser = null;
        _userRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<User>()))
            .Callback<User>(u => savedUser = u)
            .Returns(Task.CompletedTask);

        var service = CreateService();
        var result = await service.RegisterAsync(new RegisterRequest
        {
            FullName = "New Teacher",
            Email = "newteacher@school.com",
            Password = "password123",
            Role = "Teacher"
        });

        Assert.NotNull(savedUser);
        Assert.True(savedUser!.IsActive);
        Assert.Equal("hashed-password", savedUser.PasswordHash);
        Assert.NotEqual("password123", savedUser.PasswordHash);
        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal("Teacher", result.User.Role);
    }

    [Fact]
    public async Task RegisterAsync_AsStudentWithValidClassId_SetsClassIdAndClassIdClaim()
    {
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _classRepositoryMock.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(new Class { Id = 3, Name = "Class 10-A" });
        User? savedUser = null;
        _userRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<User>()))
            .Callback<User>(u => savedUser = u)
            .Returns(Task.CompletedTask);

        var service = CreateService();
        var result = await service.RegisterAsync(new RegisterRequest
        {
            FullName = "New Student",
            Email = "newstudent@school.com",
            Password = "password123",
            Role = "Student",
            ClassId = 3
        });

        Assert.Equal(3, savedUser!.ClassId);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);
        var classIdClaim = jwt.Claims.FirstOrDefault(c => c.Type == "classId");
        Assert.NotNull(classIdClaim);
        Assert.Equal("3", classIdClaim!.Value);
    }

    [Fact]
    public async Task ForgotPasswordAsync_WithKnownEmail_SetsOtpAndSendsEmail()
    {
        var user = MakeUser(UserRole.Teacher);
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

        var service = CreateService();
        await service.ForgotPasswordAsync(new ForgotPasswordRequest { Email = user.Email });

        Assert.NotNull(user.PasswordResetToken);
        Assert.Equal(6, user.PasswordResetToken!.Length);
        Assert.NotNull(user.PasswordResetTokenExpiresAt);
        Assert.True(user.PasswordResetTokenExpiresAt > DateTime.UtcNow);
        _emailServiceMock.Verify(
            e => e.SendEmailAsync(user.Email, It.IsAny<string>(), It.Is<string>(body => body.Contains(user.PasswordResetToken))),
            Times.Once);
    }

    [Fact]
    public async Task ForgotPasswordAsync_WithUnknownEmail_DoesNotSendEmail()
    {
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        var service = CreateService();
        await service.ForgotPasswordAsync(new ForgotPasswordRequest { Email = "nobody@school.com" });

        _emailServiceMock.Verify(
            e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task ResetPasswordAsync_WithValidOtp_UpdatesPasswordAndClearsToken()
    {
        var user = MakeUser(UserRole.Student);
        user.PasswordResetToken = "123456";
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(5);
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

        var service = CreateService();
        await service.ResetPasswordAsync(new ResetPasswordRequest
        {
            Email = user.Email,
            Otp = "123456",
            NewPassword = "newpassword1"
        });

        Assert.Equal("hashed-password", user.PasswordHash);
        Assert.Null(user.PasswordResetToken);
        Assert.Null(user.PasswordResetTokenExpiresAt);
    }

    [Fact]
    public async Task ResetPasswordAsync_WithWrongOtp_ThrowsBusinessRuleException()
    {
        var user = MakeUser(UserRole.Student);
        user.PasswordResetToken = "123456";
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(5);
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.ResetPasswordAsync(new ResetPasswordRequest
        {
            Email = user.Email,
            Otp = "000000",
            NewPassword = "newpassword1"
        }));
    }

    [Fact]
    public async Task ResetPasswordAsync_WithExpiredOtp_ThrowsBusinessRuleException()
    {
        var user = MakeUser(UserRole.Student);
        user.PasswordResetToken = "123456";
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(-1);
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.ResetPasswordAsync(new ResetPasswordRequest
        {
            Email = user.Email,
            Otp = "123456",
            NewPassword = "newpassword1"
        }));
    }

    [Fact]
    public async Task ResetPasswordAsync_WithDeactivatedAccount_ThrowsBusinessRuleException()
    {
        var user = MakeUser(UserRole.Student, isActive: false);
        user.PasswordResetToken = "123456";
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(5);
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

        var service = CreateService();

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.ResetPasswordAsync(new ResetPasswordRequest
        {
            Email = user.Email,
            Otp = "123456",
            NewPassword = "newpassword1"
        }));
    }

    [Fact]
    public async Task UpdateMeAsync_WithNameOnly_UpdatesNameAndKeepsPassword()
    {
        var user = MakeUser(UserRole.Teacher);
        _userRepositoryMock.Setup(r => r.GetByIdAsync(user.Id)).ReturnsAsync(user);

        var service = CreateService();
        var result = await service.UpdateMeAsync(user.Id, new UpdateMeRequest { FullName = "  Updated Name  " });

        Assert.Equal("Updated Name", result.FullName);
        Assert.Equal("Updated Name", user.FullName);
        Assert.Equal("hashed-password", user.PasswordHash);
    }

    [Fact]
    public async Task UpdateMeAsync_WithNewPassword_UpdatesPasswordHash()
    {
        var user = MakeUser(UserRole.Student);
        user.PasswordHash = "old-hash";
        _userRepositoryMock.Setup(r => r.GetByIdAsync(user.Id)).ReturnsAsync(user);

        var service = CreateService();
        await service.UpdateMeAsync(user.Id, new UpdateMeRequest { FullName = "Test User", NewPassword = "brandnewpassword" });

        Assert.Equal("hashed-password", user.PasswordHash);
        Assert.NotEqual("old-hash", user.PasswordHash);
    }

    [Fact]
    public async Task UpdateMeAsync_WithUnknownUser_ThrowsNotFound()
    {
        _userRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((User?)null);

        var service = CreateService();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.UpdateMeAsync(999, new UpdateMeRequest { FullName = "Anyone" }));
    }
}
