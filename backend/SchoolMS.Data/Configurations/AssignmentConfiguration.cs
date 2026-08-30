using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolMS.Data.Entities;

namespace SchoolMS.Data.Configurations;

public class AssignmentConfiguration : IEntityTypeConfiguration<Assignment>
{
    public void Configure(EntityTypeBuilder<Assignment> builder)
    {
        builder.ToTable("Assignments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.Description)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(a => a.Deadline)
            .IsRequired()
            .HasColumnType("timestamptz");

        builder.Property(a => a.MaxMarks)
            .IsRequired();

        builder.Property(a => a.Status)
            .IsRequired()
            .HasConversion<int>()
            .HasDefaultValue(SchoolMS.Data.Enums.AssignmentStatus.Draft);

        builder.Property(a => a.AttachmentFileName).HasMaxLength(255);
        builder.Property(a => a.AttachmentStoredName).HasMaxLength(255);
        builder.Property(a => a.AttachmentContentType).HasMaxLength(150);

        builder.Property(a => a.CreatedAt)
            .HasColumnType("timestamptz");

        builder.Property(a => a.UpdatedAt)
            .HasColumnType("timestamptz");

        builder.HasOne(a => a.Class)
            .WithMany()
            .HasForeignKey(a => a.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Subject)
            .WithMany()
            .HasForeignKey(a => a.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Teacher)
            .WithMany()
            .HasForeignKey(a => a.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
