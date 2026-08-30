namespace SchoolMS.Business.DTOs.Classes;

public class ClassResponseDto
{
    public int Id { get; set; }
    public int Grade { get; set; }
    public string Section { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}
