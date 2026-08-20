using System;
using System.Text.Json.Serialization;

namespace Klinos.Api.Models
{
    public class Paciente
    {
        public int Id { get; set; }
        
        public int Clinica_ID { get; set; }
        
        public string Nombre_Completo { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password_Hash { get; set; } = string.Empty;
        public DateTime? Fecha_Nacimiento { get; set; }
        public string? Telefono { get; set; }

        public bool IsVerified { get; set; } = false; // Por defecto no está verificado
        public string? CodigoVerificacion { get; set; }
        public DateTime? CodigoExpiracion { get; set; }

        [JsonIgnore]
        public Clinica? Clinica { get; set; }
    }

    
}