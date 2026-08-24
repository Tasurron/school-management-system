using System.ComponentModel.DataAnnotations;

namespace SchoolMS.Business.DTOs.Submissions;

public class CreateSubmissionRequest
{
    [Required]
    public int AssignmentId { get; set; }

    [Required]
    public string Content { get; set; } = string.Empty;
}
