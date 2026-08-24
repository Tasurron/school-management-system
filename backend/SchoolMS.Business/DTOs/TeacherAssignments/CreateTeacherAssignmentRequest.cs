using System.ComponentModel.DataAnnotations;

namespace SchoolMS.Business.DTOs.TeacherAssignments;

public class CreateTeacherAssignmentRequest
{
    [Required]
    public int TeacherId { get; set; }

    [Required]
    public int SubjectId { get; set; }

    [Required]
    public int ClassId { get; set; }
}
