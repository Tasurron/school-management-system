using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SchoolMS.Business.Common;
using SchoolMS.Business.DTOs.Auth;
using SchoolMS.Business.DTOs.Users;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Enums;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Business.Services;

public class AuthService : IAuthService
{
    private const int OtpExpiryMinutes = 10;

    private readonly IUserRepository _userRepository;
    private readonly IClassRepository _classRepository;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        IUserRepository userRepository,
        IClassRepository classRepository,
        IPasswordHasher<User> passwordHasher,
        INotificationService notificationService,
        IEmailService emailService,
        IOptions<JwtSettings> jwtOptions)
    {
        _userRepository = userRepository;
        _classRepository = classRepository;
        _passwordHasher = passwordHasher;
        _notificationService = notificationService;
        _emailService = emailService;
        _jwtSettings = jwtOptions.Value;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedException("This account has been deactivated.");
        }

        var verifyResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verifyResult == PasswordVerificationResult.Failed)
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        var (token, expiresAt) = GenerateToken(user);

        return new LoginResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new AuthUserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString(),
                ClassId = user.ClassId
            }
        };
    }

    public async Task<LoginResponse> RegisterAsync(RegisterRequest request)
    {
        var existing = await _userRepository.GetByEmailAsync(request.Email);
        if (existing != null)
        {
            throw new ConflictException($"A user with email '{request.Email}' already exists.");
        }

        if (!Enum.TryParse<Data.Enums.UserRole>(request.Role, true, out var role))
        {
            throw new BusinessRuleException($"Invalid role '{request.Role}'. Must be Admin, Teacher, or Student.");
        }

        int? classId = null;
        if (role == Data.Enums.UserRole.Student)
        {
            if (!request.ClassId.HasValue)
            {
                throw new BusinessRuleException("ClassId is required when registering as a Student.");
            }

            var studentClass = await _classRepository.GetByIdAsync(request.ClassId.Value);
            if (studentClass == null)
            {
                throw new NotFoundException($"Class with id {request.ClassId.Value} was not found.");
            }

            classId = request.ClassId.Value;
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = request.Email,
            Role = role,
            ClassId = classId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        var adminIds = await _userRepository.Query()
            .Where(u => u.Role == Data.Enums.UserRole.Admin && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        await _notificationService.NotifyUsersAsync(
            adminIds,
            NotificationType.NewUserRegistered,
            "New user registered",
            $"{user.FullName} registered as a {user.Role}.");

        var (token, expiresAt) = GenerateToken(user);

        return new LoginResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new AuthUserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString(),
                ClassId = user.ClassId
            }
        };
    }

    public async Task<UserResponseDto> GetMeAsync(int currentUserId)
    {
        var user = await _userRepository.GetByIdAsync(currentUserId);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        return new UserResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            ClassId = user.ClassId,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null || !user.IsActive)
        {
            // Don't reveal whether the email exists.
            return;
        }

        var otp = RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString();
        user.PasswordResetToken = otp;
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes);

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        await _emailService.SendEmailAsync(
            user.Email,
            "Your SchoolMS Password Reset Code",
            $"<p>Your password reset code is: <strong>{otp}</strong></p><p>This code expires in {OtpExpiryMinutes} minutes.</p>");
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null ||
            !user.IsActive ||
            user.PasswordResetToken == null ||
            user.PasswordResetTokenExpiresAt == null ||
            user.PasswordResetTokenExpiresAt < DateTime.UtcNow ||
            user.PasswordResetToken != request.Otp)
        {
            throw new BusinessRuleException("Invalid or expired reset code.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();
    }

    public async Task<UserResponseDto> UpdateMeAsync(int currentUserId, UpdateMeRequest request)
    {
        var user = await _userRepository.GetByIdAsync(currentUserId);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        user.FullName = request.FullName.Trim();

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        }

        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        return new UserResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            ClassId = user.ClassId,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    private (string Token, DateTime ExpiresAt) GenerateToken(User user)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        if (user.Role == Data.Enums.UserRole.Student && user.ClassId.HasValue)
        {
            claims.Add(new Claim("classId", user.ClassId.Value.ToString()));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return (tokenString, expiresAt);
    }
}
