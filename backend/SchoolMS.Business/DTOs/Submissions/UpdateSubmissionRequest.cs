using System.ComponentModel.DataAnnotations;

namespace SchoolMS.Business.DTOs.Submissions;

public class UpdateSubmissionRequest
{
    [Required]
    public string Content { get; set; } = string.Empty;
}
