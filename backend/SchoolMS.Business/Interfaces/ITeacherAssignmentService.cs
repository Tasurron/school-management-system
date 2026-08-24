using SchoolMS.Business.DTOs.TeacherAssignments;

namespace SchoolMS.Business.Interfaces;

public interface ITeacherAssignmentService
{
    // teacherIdFilter is honored only for Admins; Teachers are always forced to their own records.
    Task<List<TeacherAssignmentResponseDto>> GetAllAsync(int currentUserId, string currentUserRole, int? teacherIdFilter);
    Task<TeacherAssignmentResponseDto> GetByIdAsync(int id, int currentUserId, string currentUserRole);
    Task<TeacherAssignmentResponseDto> CreateAsync(CreateTeacherAssignmentRequest request);
    Task DeleteAsync(int id);
}
