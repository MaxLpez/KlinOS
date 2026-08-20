using System;
using System.Text.Json.Serialization;

namespace Klinos.Api.Models
{
    public class ChatMensaje
    {
        public int Id { get; set; }
        
        public int Clinica_ID { get; set; }
        public int Doctor_ID { get; set; }
        public int Paciente_ID { get; set; }
        
        public string Enviado_Por { get; set; } = string.Empty; // "Doctor" o "Paciente"
        public string Mensaje_Texto { get; set; } = string.Empty;
        public DateTime Fecha_Envio { get; set; } = DateTime.UtcNow;
        public bool Leido { get; set; } = false;

        [JsonIgnore]
        public Clinica? Clinica { get; set; }
        [JsonIgnore]
        public Doctor? Doctor { get; set; }
        [JsonIgnore]
        public Paciente? Paciente { get; set; }
    }
}