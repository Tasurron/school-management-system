namespace SchoolMS.Data.Entities;

// Which grade (8-12) a Subject applies to. One Subject can have several of
// these rows (e.g. "Physics" applies to grades 9, 10, 11 and 12).
public class SubjectGrade
{
    public int Id { get; set; }

    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public int Grade { get; set; }
}
