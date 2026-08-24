using SchoolMS.Business.DTOs.Subjects;

namespace SchoolMS.Business.Interfaces;

public interface ISubjectService
{
    Task<List<SubjectResponseDto>> GetAllAsync();
    Task<SubjectResponseDto> GetByIdAsync(int id);
    Task<SubjectResponseDto> CreateAsync(SubjectRequest request);
    Task<SubjectResponseDto> UpdateAsync(int id, SubjectRequest request);
    Task DeleteAsync(int id);
}
