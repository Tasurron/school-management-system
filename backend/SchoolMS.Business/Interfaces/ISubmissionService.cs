using SchoolMS.Business.DTOs.Submissions;

namespace SchoolMS.Business.Interfaces;

public interface ISubmissionService
{
    Task<List<SubmissionResponseDto>> GetAllAsync(
        int currentUserId,
        string currentUserRole,
        int? assignmentIdFilter,
        int? studentIdFilter);

    Task<SubmissionResponseDto> GetByIdAsync(int id, int currentUserId, string currentUserRole);
    Task<SubmissionResponseDto> CreateAsync(CreateSubmissionRequest request, int currentStudentId);
    Task<SubmissionResponseDto> UpdateAsync(int id, UpdateSubmissionRequest request, int currentStudentId);
    Task<SubmissionResponseDto> GradeAsync(int id, GradeSubmissionRequest request, int currentTeacherId);
}
