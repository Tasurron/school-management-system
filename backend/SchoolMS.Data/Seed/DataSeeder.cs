using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Enums;

namespace SchoolMS.Data.Seed;

// Idempotent seed data for local development / demo purposes.
public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db, IPasswordHasher<User> passwordHasher)
    {
        // Never re-seed if data already exists.
        if (await db.Users.AnyAsync())
        {
            return;
        }

        var now = DateTime.UtcNow;

        // 1. Classes - Grade (8-12) + Section (A-D) is the fixed vocabulary; Name is derived.
        var class9A = new Class { Grade = 9, Section = "A", Name = "Class 9 - Section A" };
        var class10A = new Class { Grade = 10, Section = "A", Name = "Class 10 - Section A" };
        var class10B = new Class { Grade = 10, Section = "B", Name = "Class 10 - Section B" };
        db.Classes.AddRange(class9A, class10A, class10B);
        await db.SaveChangesAsync();

        // 2. Subjects - a shared list covering Classes 8-12 (Bangladesh National Curriculum-style).
        var math = new Subject { Name = "Mathematics" };
        var physics = new Subject { Name = "Physics" };
        var english = new Subject { Name = "English" };
        var cs = new Subject { Name = "Computer Science" };
        var bangla = new Subject { Name = "Bangla" };
        var chemistry = new Subject { Name = "Chemistry" };
        var biology = new Subject { Name = "Biology" };
        var ict = new Subject { Name = "ICT" };
        var higherMath = new Subject { Name = "Higher Mathematics" };
        var bgs = new Subject { Name = "Bangladesh & Global Studies" };
        var religion = new Subject { Name = "Religion & Moral Education" };
        db.Subjects.AddRange(math, physics, english, cs, bangla, chemistry, biology, ict, higherMath, bgs, religion);
        await db.SaveChangesAsync();

        // 3. Users
        var admin = new User
        {
            FullName = "System Admin",
            Email = "admin@school.com",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = now
        };
        admin.PasswordHash = passwordHasher.HashPassword(admin, "Admin@123");

        var teacher1 = new User
        {
            FullName = "Mr. Rahman",
            Email = "teacher1@school.com",
            Role = UserRole.Teacher,
            IsActive = true,
            CreatedAt = now
        };
        teacher1.PasswordHash = passwordHasher.HashPassword(teacher1, "Teacher@123");

        var teacher2 = new User
        {
            FullName = "Ms. Karim",
            Email = "teacher2@school.com",
            Role = UserRole.Teacher,
            IsActive = true,
            CreatedAt = now
        };
        teacher2.PasswordHash = passwordHasher.HashPassword(teacher2, "Teacher@123");

        var student1 = new User
        {
            FullName = "Aisha Islam",
            Email = "student1@school.com",
            Role = UserRole.Student,
            ClassId = class10A.Id,
            IsActive = true,
            CreatedAt = now
        };
        student1.PasswordHash = passwordHasher.HashPassword(student1, "Student@123");

        var student2 = new User
        {
            FullName = "Rahim Uddin",
            Email = "student2@school.com",
            Role = UserRole.Student,
            ClassId = class9A.Id,
            IsActive = true,
            CreatedAt = now
        };
        student2.PasswordHash = passwordHasher.HashPassword(student2, "Student@123");

        var student3 = new User
        {
            FullName = "Nadia Ahmed",
            Email = "student3@school.com",
            Role = UserRole.Student,
            ClassId = class10B.Id,
            IsActive = true,
            CreatedAt = now
        };
        student3.PasswordHash = passwordHasher.HashPassword(student3, "Student@123");

        db.Users.AddRange(admin, teacher1, teacher2, student1, student2, student3);
        await db.SaveChangesAsync();

        // 4. TeacherSubjectClass links
        db.TeacherSubjectClasses.AddRange(
            new TeacherSubjectClass { TeacherId = teacher1.Id, SubjectId = math.Id, ClassId = class10A.Id, CreatedAt = now },
            new TeacherSubjectClass { TeacherId = teacher1.Id, SubjectId = physics.Id, ClassId = class10A.Id, CreatedAt = now },
            new TeacherSubjectClass { TeacherId = teacher2.Id, SubjectId = english.Id, ClassId = class9A.Id, CreatedAt = now },
            new TeacherSubjectClass { TeacherId = teacher2.Id, SubjectId = cs.Id, ClassId = class10B.Id, CreatedAt = now }
        );
        await db.SaveChangesAsync();

        // 5. Assignments
        var algebraHomework = new Assignment
        {
            Title = "Algebra Homework 1",
            Description = "Solve the algebra problem set covering linear equations and inequalities.",
            Deadline = now.AddDays(7),
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            ClassId = class10A.Id,
            SubjectId = math.Id,
            TeacherId = teacher1.Id,
            CreatedAt = now
        };

        var physicsLabReport = new Assignment
        {
            Title = "Physics Lab Report",
            Description = "Write up the results and analysis for the pendulum motion experiment.",
            Deadline = now.AddDays(10),
            MaxMarks = 50,
            Status = AssignmentStatus.Draft,
            ClassId = class10A.Id,
            SubjectId = physics.Id,
            TeacherId = teacher1.Id,
            CreatedAt = now
        };

        var englishEssay = new Assignment
        {
            Title = "English Essay: My Country",
            Description = "Write a 500-word essay describing your country's culture and history.",
            Deadline = now.AddDays(-3),
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            ClassId = class9A.Id,
            SubjectId = english.Id,
            TeacherId = teacher2.Id,
            CreatedAt = now
        };

        var csProjectProposal = new Assignment
        {
            Title = "CS Project Proposal",
            Description = "Submit a one-page proposal for your end-of-term programming project.",
            Deadline = now.AddDays(14),
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            ClassId = class10B.Id,
            SubjectId = cs.Id,
            TeacherId = teacher2.Id,
            CreatedAt = now
        };

        db.Assignments.AddRange(algebraHomework, physicsLabReport, englishEssay, csProjectProposal);
        await db.SaveChangesAsync();

        // 6. Submissions
        db.Submissions.AddRange(
            new Submission
            {
                AssignmentId = algebraHomework.Id,
                StudentId = student1.Id,
                Content = "Attached are my solutions to all 10 algebra problems.",
                SubmittedAt = now,
                Status = SubmissionStatus.Submitted
            },
            new Submission
            {
                AssignmentId = englishEssay.Id,
                StudentId = student2.Id,
                Content = "My country is a land of rich culture and history...",
                SubmittedAt = now.AddDays(-5),
                Status = SubmissionStatus.Graded,
                Marks = 85,
                Feedback = "Well written, good structure. Improve grammar in the third paragraph."
            },
            new Submission
            {
                AssignmentId = csProjectProposal.Id,
                StudentId = student3.Id,
                Content = "Proposal: A simple library management system built with Python.",
                SubmittedAt = now,
                Status = SubmissionStatus.Submitted
            }
        );
        await db.SaveChangesAsync();
    }
}
