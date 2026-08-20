using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Klinos.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarTablaPublicaciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expedientes_Pacientes_PacienteId",
                table: "Expedientes");

            migrationBuilder.DropIndex(
                name: "IX_Expedientes_PacienteId",
                table: "Expedientes");

            migrationBuilder.DropColumn(
                name: "PacienteId",
                table: "Expedientes");

            migrationBuilder.CreateTable(
                name: "Publicaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Doctor_ID = table.Column<int>(type: "int", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Contenido = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Fecha_Publicacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ClinicaId = table.Column<int>(type: "int", nullable: true),
                    DoctorId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Publicaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Publicaciones_Clinicas_ClinicaId",
                        column: x => x.ClinicaId,
                        principalTable: "Clinicas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Publicaciones_Doctores_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Expedientes_Paciente_ID",
                table: "Expedientes",
                column: "Paciente_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Publicaciones_ClinicaId",
                table: "Publicaciones",
                column: "ClinicaId");

            migrationBuilder.CreateIndex(
                name: "IX_Publicaciones_DoctorId",
                table: "Publicaciones",
                column: "DoctorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Expedientes_Pacientes_Paciente_ID",
                table: "Expedientes",
                column: "Paciente_ID",
                principalTable: "Pacientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expedientes_Pacientes_Paciente_ID",
                table: "Expedientes");

            migrationBuilder.DropTable(
                name: "Publicaciones");

            migrationBuilder.DropIndex(
                name: "IX_Expedientes_Paciente_ID",
                table: "Expedientes");

            migrationBuilder.AddColumn<int>(
                name: "PacienteId",
                table: "Expedientes",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Expedientes_PacienteId",
                table: "Expedientes",
                column: "PacienteId");

            migrationBuilder.AddForeignKey(
                name: "FK_Expedientes_Pacientes_PacienteId",
                table: "Expedientes",
                column: "PacienteId",
                principalTable: "Pacientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
