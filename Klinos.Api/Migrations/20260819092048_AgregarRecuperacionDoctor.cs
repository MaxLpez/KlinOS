using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Klinos.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarRecuperacionDoctor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CodigoExpiracion",
                table: "Doctores",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodigoVerificacion",
                table: "Doctores",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CodigoExpiracion",
                table: "Doctores");

            migrationBuilder.DropColumn(
                name: "CodigoVerificacion",
                table: "Doctores");
        }
    }
}
