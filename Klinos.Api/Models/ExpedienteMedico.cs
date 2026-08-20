using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations.Schema;

namespace Klinos.Api.Models
{
    public class ExpedienteMedico
    {
        public int Id { get; set; }
        
        public int Clinica_ID { get; set; }
        public int Paciente_ID { get; set; }
        public int Doctor_ID { get; set; }
        
        public DateTime Fecha_Consulta { get; set; } = DateTime.UtcNow;
        public string? Diagnostico { get; set; }
        public string? Recomendaciones { get; set; }

        [JsonIgnore]
        public Clinica? Clinica { get; set; }
        
        [ForeignKey("Paciente_ID")]
        public Paciente? Paciente { get; set; }
        [JsonIgnore]
        public Doctor? Doctor { get; set; }
        
        // Relación: Un expediente puede tener muchos archivos
        public ICollection<ArchivoEstudio>? Archivos { get; set; } = new List<ArchivoEstudio>();
    }
}