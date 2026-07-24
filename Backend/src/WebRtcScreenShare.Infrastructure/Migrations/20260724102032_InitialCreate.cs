using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace WebRtcScreenShare.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "PasswordHash", "Role", "Username" },
                values: new object[,]
                {
                    { 1, "$2a$11$k.Mg5TTgYj3D8UJVx2e8Se/kQEuIRJvMCU0cP8fGPQ7q7USbXxVmK", "Sharer", "sharer1" },
                    { 2, "$2a$11$k.Mg5TTgYj3D8UJVx2e8Se/kQEuIRJvMCU0cP8fGPQ7q7USbXxVmK", "Sharer", "sharer2" },
                    { 3, "$2a$11$k.Mg5TTgYj3D8UJVx2e8Se/kQEuIRJvMCU0cP8fGPQ7q7USbXxVmK", "Viewer", "viewer1" },
                    { 4, "$2a$11$k.Mg5TTgYj3D8UJVx2e8Se/kQEuIRJvMCU0cP8fGPQ7q7USbXxVmK", "Viewer", "viewer2" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
