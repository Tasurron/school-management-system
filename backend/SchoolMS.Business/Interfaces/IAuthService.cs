using SchoolMS.Business.DTOs.Auth;
using SchoolMS.Business.DTOs.Users;

namespace SchoolMS.Business.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RegisterAsync(RegisterRequest request);
    Task<UserResponseDto> GetMeAsync(int currentUserId);
}
