using SchoolMS.Business.DTOs.Users;

namespace SchoolMS.Business.Interfaces;

public interface IUserService
{
    Task<List<UserResponseDto>> GetAllAsync(string? role, int? classId);
    Task<UserResponseDto> GetByIdAsync(int id);
    Task<UserResponseDto> CreateAsync(CreateUserRequest request, int currentAdminId);
    Task<UserResponseDto> UpdateAsync(int id, UpdateUserRequest request, int currentAdminId);
    Task DeactivateAsync(int id, int currentAdminId);
    Task ActivateAsync(int id, int currentAdminId);
}
