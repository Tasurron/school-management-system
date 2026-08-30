using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddClassGradeSectionAndAssignmentAttachment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Classes_Name",
                table: "Classes");

            migrationBuilder.AddColumn<int>(
                name: "Grade",
                table: "Classes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Section",
                table: "Classes",
                type: "character varying(1)",
                maxLength: 1,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AttachmentContentType",
                table: "Assignments",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AttachmentFileName",
                table: "Assignments",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "AttachmentSize",
                table: "Assignments",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AttachmentStoredName",
                table: "Assignments",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            // Backfill Grade/Section for existing rows from the old "Class {grade}-{section}"
            // name (e.g. "Class 10-B" -> Grade 10, Section "B"), then rebuild Name in the new
            // "Class {grade} - Section {section}" format. Existing data/IDs are preserved -
            // nothing referencing these ClassId values needs to change.
            migrationBuilder.Sql(
                @"UPDATE ""Classes""
                  SET ""Grade"" = CAST(substring(""Name"" from 'Class (\d+)-') AS integer),
                      ""Section"" = upper(substring(""Name"" from '-(\w)$'));");

            migrationBuilder.Sql(
                @"UPDATE ""Classes""
                  SET ""Name"" = 'Class ' || ""Grade"" || ' - Section ' || ""Section"";");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_Grade_Section",
                table: "Classes",
                columns: new[] { "Grade", "Section" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Classes_Grade_Section",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "Grade",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "Section",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "AttachmentContentType",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "AttachmentFileName",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "AttachmentSize",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "AttachmentStoredName",
                table: "Assignments");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_Name",
                table: "Classes",
                column: "Name",
                unique: true);
        }
    }
}
