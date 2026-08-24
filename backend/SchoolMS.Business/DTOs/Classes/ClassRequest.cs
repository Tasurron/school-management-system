using System.ComponentModel.DataAnnotations;

namespace SchoolMS.Business.DTOs.Classes;

// Used for both create and update.
public class ClassRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}
