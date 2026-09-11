namespace SchoolMS.Data.Entities;

public class Subject
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }

    // Which grades (8-12) this subject is taught in. Empty means the subject
    // isn't part of the current curriculum list (kept only for historical data).
    public ICollection<SubjectGrade> Grades { get; set; } = new List<SubjectGrade>();
}
