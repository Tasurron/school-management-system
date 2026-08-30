using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

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

    [Required]
    public int ClassGrade { get; set; }

    [Required]
    public string ClassSection { get; set; } = string.Empty;

    [Required]
    public int SubjectId { get; set; }

    // "Draft" or "Published"
    [Required]
    public string Status { get; set; } = string.Empty;

    // Optional: upload a new attachment (replaces any existing one).
    public IFormFile? Attachment { get; set; }

    // Optional: set true to remove the existing attachment without replacing it.
    public bool RemoveAttachment { get; set; }
}
