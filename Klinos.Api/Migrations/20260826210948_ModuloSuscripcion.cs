using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Klinos.Api.Migrations
{
    /// <inheritdoc />
    public partial class ModuloSuscripcion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Metodo_Pago",
                table: "Clinicas",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Numero_Licencia",
                table: "Clinicas",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "Suscripcion_Cancelada",
                table: "Clinicas",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Metodo_Pago",
                table: "Clinicas");

            migrationBuilder.DropColumn(
                name: "Numero_Licencia",
                table: "Clinicas");

            migrationBuilder.DropColumn(
                name: "Suscripcion_Cancelada",
                table: "Clinicas");
        }
    }
}
