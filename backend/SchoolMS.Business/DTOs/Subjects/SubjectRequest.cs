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

    // Which grades (8-12) this subject should apply to. Can be left empty for
    // a subject that isn't tied to a specific grade (e.g. a legacy subject).
    public List<int> ApplicableGrades { get; set; } = new();
}
