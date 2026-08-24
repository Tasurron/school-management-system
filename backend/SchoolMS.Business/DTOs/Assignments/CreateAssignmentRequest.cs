using System.ComponentModel.DataAnnotations;

namespace SchoolMS.Business.DTOs.Assignments;

public class CreateAssignmentRequest
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

    [Required]
    public int ClassId { get; set; }

    [Required]
    public int SubjectId { get; set; }

    // Optional; defaults to Draft if not provided. "Draft" or "Published".
    public string? Status { get; set; }
}
