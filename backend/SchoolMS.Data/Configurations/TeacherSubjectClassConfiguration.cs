using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolMS.Data.Entities;

namespace SchoolMS.Data.Configurations;

public class TeacherSubjectClassConfiguration : IEntityTypeConfiguration<TeacherSubjectClass>
{
    public void Configure(EntityTypeBuilder<TeacherSubjectClass> builder)
    {
        builder.ToTable("TeacherSubjectClasses");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.CreatedAt)
            .HasColumnType("timestamptz");

        builder.HasIndex(t => new { t.TeacherId, t.SubjectId, t.ClassId })
            .IsUnique();

        builder.HasOne(t => t.Teacher)
            .WithMany()
            .HasForeignKey(t => t.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Subject)
            .WithMany()
            .HasForeignKey(t => t.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Class)
            .WithMany()
            .HasForeignKey(t => t.ClassId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
