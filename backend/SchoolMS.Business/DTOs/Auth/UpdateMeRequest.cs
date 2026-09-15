using System.ComponentModel.DataAnnotations;

namespace SchoolMS.Business.DTOs.Auth;

public class UpdateMeRequest
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    // Optional - leave blank to keep the current password.
    [MinLength(6)]
    public string? NewPassword { get; set; }
}
