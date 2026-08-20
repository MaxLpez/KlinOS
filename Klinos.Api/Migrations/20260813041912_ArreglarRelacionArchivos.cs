using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Klinos.Api.Migrations
{
    /// <inheritdoc />
    public partial class ArreglarRelacionArchivos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ArchivosEstudios_Expedientes_ExpedienteId",
                table: "ArchivosEstudios");

            migrationBuilder.DropIndex(
                name: "IX_ArchivosEstudios_ExpedienteId",
                table: "ArchivosEstudios");

            migrationBuilder.DropColumn(
                name: "ExpedienteId",
                table: "ArchivosEstudios");

            migrationBuilder.CreateIndex(
                name: "IX_ArchivosEstudios_Expediente_ID",
                table: "ArchivosEstudios",
                column: "Expediente_ID");

            migrationBuilder.AddForeignKey(
                name: "FK_ArchivosEstudios_Expedientes_Expediente_ID",
                table: "ArchivosEstudios",
                column: "Expediente_ID",
                principalTable: "Expedientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ArchivosEstudios_Expedientes_Expediente_ID",
                table: "ArchivosEstudios");

            migrationBuilder.DropIndex(
                name: "IX_ArchivosEstudios_Expediente_ID",
                table: "ArchivosEstudios");

            migrationBuilder.AddColumn<int>(
                name: "ExpedienteId",
                table: "ArchivosEstudios",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ArchivosEstudios_ExpedienteId",
                table: "ArchivosEstudios",
                column: "ExpedienteId");

            migrationBuilder.AddForeignKey(
                name: "FK_ArchivosEstudios_Expedientes_ExpedienteId",
                table: "ArchivosEstudios",
                column: "ExpedienteId",
                principalTable: "Expedientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
