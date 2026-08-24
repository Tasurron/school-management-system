namespace SchoolMS.Business.DTOs.Submissions;

public class SubmissionResponseDto
{
    public int Id { get; set; }

    public int AssignmentId { get; set; }
    public string AssignmentTitle { get; set; } = string.Empty;
    public int MaxMarks { get; set; }

    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public string Status { get; set; } = string.Empty;
    public int? Marks { get; set; }
    public string? Feedback { get; set; }
}
