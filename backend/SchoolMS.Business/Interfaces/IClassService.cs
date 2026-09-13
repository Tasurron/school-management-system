using SchoolMS.Business.DTOs.Classes;

namespace SchoolMS.Business.Interfaces;

public interface IClassService
{
    Task<List<ClassResponseDto>> GetAllAsync();
    Task<ClassResponseDto> GetByIdAsync(int id);
    Task<ClassResponseDto> CreateAsync(ClassRequest request, int currentAdminId);
    Task<ClassResponseDto> UpdateAsync(int id, ClassRequest request, int currentAdminId);
    Task DeleteAsync(int id, int currentAdminId);
}
