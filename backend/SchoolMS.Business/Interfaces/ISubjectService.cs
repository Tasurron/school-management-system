using SchoolMS.Business.DTOs.Subjects;

namespace SchoolMS.Business.Interfaces;

public interface ISubjectService
{
    Task<List<SubjectResponseDto>> GetAllAsync();
    Task<SubjectResponseDto> GetByIdAsync(int id);
    Task<SubjectResponseDto> CreateAsync(SubjectRequest request, int currentAdminId);
    Task<SubjectResponseDto> UpdateAsync(int id, SubjectRequest request, int currentAdminId);
    Task DeleteAsync(int id, int currentAdminId);
}
