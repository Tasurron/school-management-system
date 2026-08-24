using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolMS.Data.Entities;

namespace SchoolMS.Data.Configurations;

public class SubmissionConfiguration : IEntityTypeConfiguration<Submission>
{
    public void Configure(EntityTypeBuilder<Submission> builder)
    {
        builder.ToTable("Submissions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Content)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(s => s.SubmittedAt)
            .HasColumnType("timestamptz");

        builder.Property(s => s.UpdatedAt)
            .HasColumnType("timestamptz");

        builder.Property(s => s.Status)
            .IsRequired()
            .HasConversion<int>()
            .HasDefaultValue(SchoolMS.Data.Enums.SubmissionStatus.Submitted);

        builder.Property(s => s.Feedback)
            .HasColumnType("text");

        builder.HasIndex(s => new { s.AssignmentId, s.StudentId })
            .IsUnique();

        // Deleting an Assignment cascades to delete its Submissions.
        builder.HasOne(s => s.Assignment)
            .WithMany(a => a.Submissions)
            .HasForeignKey(s => s.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Deleting a Student (User) is restricted while Submissions reference them.
        builder.HasOne(s => s.Student)
            .WithMany()
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
