using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolMS.Data.Entities;

namespace SchoolMS.Data.Configurations;

public class SubjectGradeConfiguration : IEntityTypeConfiguration<SubjectGrade>
{
    public void Configure(EntityTypeBuilder<SubjectGrade> builder)
    {
        builder.ToTable("SubjectGrades");

        builder.HasKey(sg => sg.Id);

        builder.HasOne(sg => sg.Subject)
            .WithMany(s => s.Grades)
            .HasForeignKey(sg => sg.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(sg => new { sg.SubjectId, sg.Grade })
            .IsUnique();
    }
}
