using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Klinos.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarVerificacionPaciente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CodigoExpiracion",
                table: "Pacientes",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodigoVerificacion",
                table: "Pacientes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsVerified",
                table: "Pacientes",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CodigoExpiracion",
                table: "Pacientes");

            migrationBuilder.DropColumn(
                name: "CodigoVerificacion",
                table: "Pacientes");

            migrationBuilder.DropColumn(
                name: "IsVerified",
                table: "Pacientes");
        }
    }
}
