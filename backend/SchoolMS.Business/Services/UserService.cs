using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SchoolMS.Business.DTOs.Users;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Enums;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Business.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly INotificationService _notificationService;

    public UserService(
        IUserRepository userRepository,
        IPasswordHasher<User> passwordHasher,
        INotificationService notificationService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _notificationService = notificationService;
    }

    public async Task<List<UserResponseDto>> GetAllAsync(string? role, int? classId)
    {
        var query = _userRepository.Query().Include(u => u.Class).AsQueryable();

        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
        {
            query = query.Where(u => u.Role == parsedRole);
        }

        if (classId.HasValue)
        {
            query = query.Where(u => u.ClassId == classId.Value);
        }

        var users = await query.OrderBy(u => u.Id).ToListAsync();
        return users.Select(MapToDto).ToList();
    }

    public async Task<UserResponseDto> GetByIdAsync(int id)
    {
        var user = await _userRepository.Query()
            .Include(u => u.Class)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            throw new NotFoundException($"User with id {id} was not found.");
        }

        return MapToDto(user);
    }

    public async Task<UserResponseDto> CreateAsync(CreateUserRequest request, int currentAdminId)
    {
        var existing = await _userRepository.GetByEmailAsync(request.Email);
        if (existing != null)
        {
            throw new ConflictException($"A user with email '{request.Email}' already exists.");
        }

        if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
        {
            throw new BusinessRuleException($"Invalid role '{request.Role}'. Must be Admin, Teacher, or Student.");
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            Role = role,
            ClassId = role == UserRole.Student ? request.ClassId : null,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        await _notificationService.NotifyUsersAsync(
            new[] { user.Id },
            NotificationType.UserAccountCreated,
            "Account created",
            "Your account has been created. You can now log in.");

        var otherAdminIds = await OtherAdminIdsAsync(currentAdminId, user.Id);
        await _notificationService.NotifyUsersAsync(
            otherAdminIds,
            NotificationType.UserAccountCreated,
            "User created",
            $"{user.FullName} ({user.Role}) was added by an admin.");

        return await GetByIdAsync(user.Id);
    }

    public async Task<UserResponseDto> UpdateAsync(int id, UpdateUserRequest request, int currentAdminId)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            throw new NotFoundException($"User with id {id} was not found.");
        }

        if (!string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase))
        {
            var existing = await _userRepository.GetByEmailAsync(request.Email);
            if (existing != null && existing.Id != id)
            {
                throw new ConflictException($"A user with email '{request.Email}' already exists.");
            }
        }

        user.FullName = request.FullName;
        user.Email = request.Email;
        if (user.Role == UserRole.Student)
        {
            user.ClassId = request.ClassId;
        }
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        await _notificationService.NotifyUsersAsync(
            new[] { user.Id },
            NotificationType.UserAccountUpdated,
            "Account updated",
            "Your account details were updated by an admin.");

        var otherAdminIds = await OtherAdminIdsAsync(currentAdminId, user.Id);
        await _notificationService.NotifyUsersAsync(
            otherAdminIds,
            NotificationType.UserAccountUpdated,
            "User updated",
            $"{user.FullName}'s account was updated by an admin.");

        return await GetByIdAsync(user.Id);
    }

    public async Task DeactivateAsync(int id, int currentAdminId)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            throw new NotFoundException($"User with id {id} was not found.");
        }

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        await _notificationService.NotifyUsersAsync(
            new[] { user.Id },
            NotificationType.UserAccountDeactivated,
            "Account deactivated",
            "Your account has been deactivated by an admin.");

        var otherAdminIds = await OtherAdminIdsAsync(currentAdminId, user.Id);
        await _notificationService.NotifyUsersAsync(
            otherAdminIds,
            NotificationType.UserAccountDeactivated,
            "User deactivated",
            $"{user.FullName}'s account was deactivated by an admin.");
    }

    // Excludes both the acting admin (so they don't get notified about their own
    // action) and the user the action was performed on (who already gets their own,
    // first-person notification above - relevant when that target user is itself an Admin).
    private async Task<List<int>> OtherAdminIdsAsync(int currentAdminId, int excludeUserId) =>
        await _userRepository.Query()
            .Where(u => u.Role == UserRole.Admin && u.Id != currentAdminId && u.Id != excludeUserId && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

    private static UserResponseDto MapToDto(User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role.ToString(),
        ClassId = user.ClassId,
        ClassName = user.Class?.Name,
        IsActive = user.IsActive,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt
    };
}
