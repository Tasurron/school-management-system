using System.ComponentModel.DataAnnotations;

namespace SchoolMS.Business.DTOs.Classes;

// Used for both create and update. Grade/Section are a fixed vocabulary
// (Grade 8-12, Section A-D) - validated in ClassService.
public class ClassRequest
{
    [Required]
    [Range(8, 12)]
    public int Grade { get; set; }

    [Required]
    [MaxLength(1)]
    public string Section { get; set; } = string.Empty;
}
