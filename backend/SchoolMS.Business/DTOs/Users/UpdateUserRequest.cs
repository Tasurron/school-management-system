using System.ComponentModel.DataAnnotations;

namespace SchoolMS.Business.DTOs.Users;

public class UpdateUserRequest
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    // Only relevant when the user is a Student
    public int? ClassId { get; set; }
}
