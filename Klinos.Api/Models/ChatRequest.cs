namespace Klinos.Api.Models
{
    public class ChatRequest
    {
        // Este ID será el del doctor si quien pregunta es el paciente,
        // o el ID del paciente si quien pregunta es el doctor.
        public int OtherUserId { get; set; } 
    }
}