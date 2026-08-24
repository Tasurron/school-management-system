using System.ComponentModel.DataAnnotations;

namespace SchoolMS.Business.DTOs.Subjects;

// Used for both create and update.
public class SubjectRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Code { get; set; }
}
