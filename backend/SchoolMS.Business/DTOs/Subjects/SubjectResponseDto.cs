namespace SchoolMS.Business.DTOs.Subjects;

public class SubjectResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }

    // Which grades (8-12) this subject applies to. Empty for subjects kept
    // only for historical assignments (e.g. an old subject no longer taught).
    public List<int> ApplicableGrades { get; set; } = new();
}
