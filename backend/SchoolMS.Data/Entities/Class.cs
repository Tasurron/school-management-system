namespace SchoolMS.Data.Entities;

public class Class
{
    public int Id { get; set; }

    // Fixed vocabulary: Grade is 8-12, Section is A-D (enforced in ClassService).
    public int Grade { get; set; }
    public string Section { get; set; } = string.Empty;

    // Derived display name, e.g. "Class 10 - Section A" - kept as a stored column so
    // every existing screen that just shows a class's Name keeps working unchanged.
    public string Name { get; set; } = string.Empty;
}
