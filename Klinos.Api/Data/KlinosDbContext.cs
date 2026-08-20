using Microsoft.EntityFrameworkCore;
using Klinos.Api.Models;

namespace Klinos.Api.Data
{
    public class KlinosDbContext : DbContext
    {
        public KlinosDbContext(DbContextOptions<KlinosDbContext> options) : base(options) { }

        public DbSet<Clinica> Clinicas { get; set; }
        public DbSet<Doctor> Doctores { get; set; }
        public DbSet<Paciente> Pacientes { get; set; }
        public DbSet<Cita> Citas { get; set; }
        public DbSet<ExpedienteMedico> Expedientes { get; set; }
        public DbSet<ArchivoEstudio> ArchivosEstudios { get; set; }
        public DbSet<ChatMensaje> ChatMensajes { get; set; }

        public DbSet<Publicacion> Publicaciones { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Desactivar el borrado en cascada para evitar errores en SQL Server 
            // con las múltiples relaciones hacia la Clínica.
            foreach (var relationship in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
            {
                relationship.DeleteBehavior = DeleteBehavior.Restrict;
            }
        }
    }
}