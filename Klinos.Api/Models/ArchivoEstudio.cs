using System;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations.Schema; // <-- Agregamos esto

namespace Klinos.Api.Models
{
    public class ArchivoEstudio
    {
        public int Id { get; set; }
        
        // ¡Magia aquí! Le decimos a C# que esta es la llave oficial
        [ForeignKey("Expediente")] 
        public int Expediente_ID { get; set; }
        
        public string Nombre_Original { get; set; } = string.Empty;
        public string Ruta_Archivo { get; set; } = string.Empty; 
        public string? Tipo_Archivo { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? Tamano_MB { get; set; }
        public DateTime Fecha_Subida { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public ExpedienteMedico? Expediente { get; set; }
    }
}