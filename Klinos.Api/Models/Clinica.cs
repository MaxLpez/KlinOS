using System;

namespace Klinos.Api.Models
{
    public class Clinica
    {
        public int Id { get; set; }
        public string Nombre_Clinica { get; set; } = string.Empty;
        public string Subdominio_URL { get; set; } = string.Empty;
        public string? Ruta_Local_Logo { get; set; }
        public string? Telefono_Contacto { get; set; }
        public DateTime Fecha_Registro { get; set; } = DateTime.UtcNow;
    }
}