using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SchoolMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSubjectGrades : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SubjectGrades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubjectId = table.Column<int>(type: "integer", nullable: false),
                    Grade = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubjectGrades", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubjectGrades_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SubjectGrades_SubjectId_Grade",
                table: "SubjectGrades",
                columns: new[] { "SubjectId", "Grade" },
                unique: true);

            // A few subjects seeded earlier used shortened/ampersand wording. Rename them to
            // match the official curriculum names before mapping subjects to grades below, so
            // these existing rows (and any assignments already referencing them) line up with
            // the new names instead of becoming duplicates.
            migrationBuilder.Sql(
                @"UPDATE ""Subjects"" SET ""Name"" = 'Information and Communication Technology (ICT)' WHERE ""Name"" = 'ICT';");
            migrationBuilder.Sql(
                @"UPDATE ""Subjects"" SET ""Name"" = 'Bangladesh and Global Studies' WHERE ""Name"" = 'Bangladesh & Global Studies';");
            migrationBuilder.Sql(
                @"UPDATE ""Subjects"" SET ""Name"" = 'Religion and Moral Education' WHERE ""Name"" = 'Religion & Moral Education';");

            // Insert every subject from the Class 8-12 curriculum, plus "Computer Science"
            // (not part of this curriculum, but kept so any assignment already referencing it
            // - or the demo seed data - still has a subject to point to; it gets no grade
            // mapping below, so it won't appear as a pickable option for new assignments).
            // ON CONFLICT DO NOTHING makes this safe whether the database already had some of
            // these subjects (existing dev/demo data) or is completely empty (fresh install).
            migrationBuilder.Sql(
                @"INSERT INTO ""Subjects"" (""Name"") VALUES
                    ('Bangla'),
                    ('English'),
                    ('Mathematics'),
                    ('Science'),
                    ('Bangladesh and Global Studies'),
                    ('Information and Communication Technology (ICT)'),
                    ('Physical Education and Health'),
                    ('Work and Life Oriented Education'),
                    ('Agriculture Studies'),
                    ('Home Science'),
                    ('Arts and Crafts'),
                    ('Islamic Studies'),
                    ('Hindu Religion Studies'),
                    ('Christian Religion Studies'),
                    ('Buddhist Religion Studies'),
                    ('Religion and Moral Education'),
                    ('Career Education'),
                    ('Physical Education, Health Science and Sports'),
                    ('Physics'),
                    ('Chemistry'),
                    ('Biology'),
                    ('Higher Mathematics'),
                    ('Accounting'),
                    ('Finance and Banking'),
                    ('Business Entrepreneurship'),
                    ('History of Bangladesh and World Civilization'),
                    ('Geography and Environment'),
                    ('Economics'),
                    ('Civics and Citizenship'),
                    ('Business Organization and Management'),
                    ('Finance, Banking and Insurance'),
                    ('Production Management and Marketing'),
                    ('History'),
                    ('Geography'),
                    ('Civics and Good Governance'),
                    ('Sociology'),
                    ('Social Work'),
                    ('Logic'),
                    ('Islamic History and Culture'),
                    ('Psychology'),
                    ('Statistics'),
                    ('Home Economics'),
                    ('Computer Science')
                ON CONFLICT (""Name"") DO NOTHING;");

            // Map every curriculum subject to the grades it's taught in.
            migrationBuilder.Sql(
                @"INSERT INTO ""SubjectGrades"" (""SubjectId"", ""Grade"")
                  SELECT s.""Id"", v.grade
                  FROM (VALUES
                    ('Bangla', 8), ('Bangla', 9), ('Bangla', 10), ('Bangla', 11), ('Bangla', 12),
                    ('English', 8), ('English', 9), ('English', 10), ('English', 11), ('English', 12),
                    ('Mathematics', 8), ('Mathematics', 9), ('Mathematics', 10),
                    ('Science', 8),
                    ('Bangladesh and Global Studies', 8), ('Bangladesh and Global Studies', 9), ('Bangladesh and Global Studies', 10),
                    ('Information and Communication Technology (ICT)', 8), ('Information and Communication Technology (ICT)', 9), ('Information and Communication Technology (ICT)', 10), ('Information and Communication Technology (ICT)', 11), ('Information and Communication Technology (ICT)', 12),
                    ('Physical Education and Health', 8),
                    ('Work and Life Oriented Education', 8),
                    ('Agriculture Studies', 8), ('Agriculture Studies', 9), ('Agriculture Studies', 10),
                    ('Home Science', 8), ('Home Science', 9), ('Home Science', 10),
                    ('Arts and Crafts', 8), ('Arts and Crafts', 9), ('Arts and Crafts', 10),
                    ('Islamic Studies', 8),
                    ('Hindu Religion Studies', 8),
                    ('Christian Religion Studies', 8),
                    ('Buddhist Religion Studies', 8),
                    ('Religion and Moral Education', 9), ('Religion and Moral Education', 10),
                    ('Career Education', 9), ('Career Education', 10),
                    ('Physical Education, Health Science and Sports', 9), ('Physical Education, Health Science and Sports', 10),
                    ('Physics', 9), ('Physics', 10), ('Physics', 11), ('Physics', 12),
                    ('Chemistry', 9), ('Chemistry', 10), ('Chemistry', 11), ('Chemistry', 12),
                    ('Biology', 9), ('Biology', 10), ('Biology', 11), ('Biology', 12),
                    ('Higher Mathematics', 9), ('Higher Mathematics', 10), ('Higher Mathematics', 11), ('Higher Mathematics', 12),
                    ('Accounting', 9), ('Accounting', 10), ('Accounting', 11), ('Accounting', 12),
                    ('Finance and Banking', 9), ('Finance and Banking', 10),
                    ('Business Entrepreneurship', 9), ('Business Entrepreneurship', 10),
                    ('History of Bangladesh and World Civilization', 9), ('History of Bangladesh and World Civilization', 10),
                    ('Geography and Environment', 9), ('Geography and Environment', 10),
                    ('Economics', 9), ('Economics', 10), ('Economics', 11), ('Economics', 12),
                    ('Civics and Citizenship', 9), ('Civics and Citizenship', 10),
                    ('Business Organization and Management', 11), ('Business Organization and Management', 12),
                    ('Finance, Banking and Insurance', 11), ('Finance, Banking and Insurance', 12),
                    ('Production Management and Marketing', 11), ('Production Management and Marketing', 12),
                    ('History', 11), ('History', 12),
                    ('Geography', 11), ('Geography', 12),
                    ('Civics and Good Governance', 11), ('Civics and Good Governance', 12),
                    ('Sociology', 11), ('Sociology', 12),
                    ('Social Work', 11), ('Social Work', 12),
                    ('Logic', 11), ('Logic', 12),
                    ('Islamic History and Culture', 11), ('Islamic History and Culture', 12),
                    ('Psychology', 11), ('Psychology', 12),
                    ('Statistics', 11), ('Statistics', 12),
                    ('Home Economics', 11), ('Home Economics', 12)
                  ) AS v(name, grade)
                  JOIN ""Subjects"" s ON s.""Name"" = v.name
                  ON CONFLICT (""SubjectId"", ""Grade"") DO NOTHING;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SubjectGrades");

            migrationBuilder.Sql(
                @"UPDATE ""Subjects"" SET ""Name"" = 'ICT' WHERE ""Name"" = 'Information and Communication Technology (ICT)';");
            migrationBuilder.Sql(
                @"UPDATE ""Subjects"" SET ""Name"" = 'Bangladesh & Global Studies' WHERE ""Name"" = 'Bangladesh and Global Studies';");
            migrationBuilder.Sql(
                @"UPDATE ""Subjects"" SET ""Name"" = 'Religion & Moral Education' WHERE ""Name"" = 'Religion and Moral Education';");
        }
    }
}
