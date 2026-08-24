using System.ComponentModel.DataAnnotations;

namespace SchoolMS.Business.DTOs.Assignments;

public class UpdateAssignmentRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime Deadline { get; set; }

    [Required]
    public int MaxMarks { get; set; }

    // "Draft" or "Published"
    [Required]
    public string Status { get; set; } = string.Empty;
}
