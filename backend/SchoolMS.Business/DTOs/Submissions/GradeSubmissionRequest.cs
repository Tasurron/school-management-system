using System.ComponentModel.DataAnnotations;

namespace SchoolMS.Business.DTOs.Submissions;

public class GradeSubmissionRequest
{
    [Required]
    [Range(0, int.MaxValue)]
    public int Marks { get; set; }

    public string? Feedback { get; set; }
}
