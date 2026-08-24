using SchoolMS.Business.DTOs.Assignments;

namespace SchoolMS.Business.Interfaces;

public interface IAssignmentService
{
    // Visibility depends on currentUserRole: Admin sees all (optionally filtered), Teacher sees only
    // assignments they own, Student sees only Published assignments for their own class.
    Task<List<AssignmentResponseDto>> GetAllAsync(
        int currentUserId,
        string currentUserRole,
        int? classIdFilter,
        int? subjectIdFilter,
        int? teacherIdFilter);

    Task<AssignmentResponseDto> GetByIdAsync(int id, int currentUserId, string currentUserRole);
    Task<AssignmentResponseDto> CreateAsync(CreateAssignmentRequest request, int currentTeacherId);
    Task<AssignmentResponseDto> UpdateAsync(int id, UpdateAssignmentRequest request, int currentTeacherId);
    Task DeleteAsync(int id, int currentTeacherId);
}
