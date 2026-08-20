using System;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations.Schema;

namespace Klinos.Api.Models
{
    public class Doctor
    {
        public int Id { get; set; }
        
        // Llave Foránea hacia la Clínica
        public int Clinica_ID { get; set; }
        
        public string Nombre_Completo { get; set; } = string.Empty;
        public string? Especialidad { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Password_Hash { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Tarifa_Consulta { get; set; }
        public bool Activo { get; set; } = true;

        public string? CodigoVerificacion { get; set; }
        public DateTime? CodigoExpiracion { get; set; }

        // Propiedad de navegación (Le dice a EF Core que un Doctor pertenece a una Clínica)
        [JsonIgnore]
        public Clinica? Clinica { get; set; }
    }
}