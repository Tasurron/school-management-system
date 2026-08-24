namespace SchoolMS.Data.Entities;

// Links a Teacher to a Subject they teach in a specific Class.
public class TeacherSubjectClass
{
    public int Id { get; set; }

    public int TeacherId { get; set; }
    public User Teacher { get; set; } = null!;

    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public int ClassId { get; set; }
    public Class Class { get; set; } = null!;

    public DateTime CreatedAt { get; set; }
}
