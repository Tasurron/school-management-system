using SchoolMS.Business.DTOs.Classes;

namespace SchoolMS.Business.Interfaces;

public interface IClassService
{
    Task<List<ClassResponseDto>> GetAllAsync();
    Task<ClassResponseDto> GetByIdAsync(int id);
    Task<ClassResponseDto> CreateAsync(ClassRequest request);
    Task<ClassResponseDto> UpdateAsync(int id, ClassRequest request);
    Task DeleteAsync(int id);
}
