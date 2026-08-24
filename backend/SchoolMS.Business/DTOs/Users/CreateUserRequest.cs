using System.ComponentModel.DataAnnotations;

namespace SchoolMS.Business.DTOs.Users;

public class CreateUserRequest
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    // "Admin", "Teacher" or "Student"
    [Required]
    public string Role { get; set; } = string.Empty;

    // Required only when Role is "Student"
    public int? ClassId { get; set; }
}
