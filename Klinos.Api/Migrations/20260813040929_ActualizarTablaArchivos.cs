using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Klinos.Api.Migrations
{
    /// <inheritdoc />
    public partial class ActualizarTablaArchivos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Tipo_Extension",
                table: "ArchivosEstudios",
                newName: "Tipo_Archivo");

            migrationBuilder.RenameColumn(
                name: "Ruta_Local_Archivo",
                table: "ArchivosEstudios",
                newName: "Ruta_Archivo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Tipo_Archivo",
                table: "ArchivosEstudios",
                newName: "Tipo_Extension");

            migrationBuilder.RenameColumn(
                name: "Ruta_Archivo",
                table: "ArchivosEstudios",
                newName: "Ruta_Local_Archivo");
        }
    }
}
