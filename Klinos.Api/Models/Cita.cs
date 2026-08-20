using System;
using System.Text.Json.Serialization;

namespace Klinos.Api.Models
{
    public class Cita
    {
        public int Id { get; set; }
        
        public int Clinica_ID { get; set; }
        public int Doctor_ID { get; set; }
        public int Paciente_ID { get; set; }
        
        public DateTime Fecha_Hora { get; set; }
        public string Estado { get; set; } = "Pendiente";
        public string? Motivo_Consulta { get; set; }

        [JsonIgnore]
        public Clinica? Clinica { get; set; }
        [JsonIgnore]
        public Doctor? Doctor { get; set; }
        [JsonIgnore]
        public Paciente? Paciente { get; set; }
    }
}