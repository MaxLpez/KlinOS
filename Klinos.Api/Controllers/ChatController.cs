using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Klinos.Api.Data;
using Klinos.Api.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Klinos.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        [HttpPost("ConteoNuevos")]
        public async Task<IActionResult> ObtenerConteoNuevos([FromBody] ConteoRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = User.FindFirst("rol")?.Value ?? User.FindFirst(ClaimTypes.Role)?.Value;

            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            int doctorId = userRole == "Paciente" ? request.OtherUserId : currentUserId;
            int pacienteId = userRole == "Paciente" ? currentUserId : request.OtherUserId;
            
            // Si soy paciente, quiero contar los mensajes que envió el Doctor, y viceversa
            string remitenteAContar = userRole == "Paciente" ? "Doctor" : "Paciente";

            int conteo = await _context.ChatMensajes
                .CountAsync(m => m.Doctor_ID == doctorId && 
                                 m.Paciente_ID == pacienteId && 
                                 m.Enviado_Por == remitenteAContar && 
                                 m.Fecha_Envio > request.UltimoAcceso);

            return Ok(new { nuevos = conteo });
        }
        private readonly KlinosDbContext _context;

        public ChatController(KlinosDbContext context)
        {
            _context = context;
        }

        // GET: api/Chat/Historial
        [HttpPost("Historial")]
        public async Task<IActionResult> ObtenerHistorial([FromBody] ChatRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = User.FindFirst("rol")?.Value;

            if (!int.TryParse(userIdClaim, out int currentUserId))
                return Unauthorized();

            int doctorId;
            int pacienteId;

            // Lógica para determinar quién está consultando y quién es la contraparte
            if (userRole == "Paciente")
            {
                pacienteId = currentUserId; // El paciente es el usuario logueado
                doctorId = request.OtherUserId; // El doctor es el que viene en el Body
            }
            else if (userRole == "Doctor")
            {
                doctorId = currentUserId; // El doctor es el usuario logueado
                pacienteId = request.OtherUserId; // El paciente es el que viene en el Body
            }
            else
            {
                return Forbid();
            }

            // Consultamos de forma segura
            var mensajes = await _context.ChatMensajes
                .Where(m => m.Doctor_ID == doctorId && m.Paciente_ID == pacienteId)
                .OrderBy(m => m.Fecha_Envio)
                .ToListAsync();

            return Ok(mensajes);
        }
    }
}

namespace Klinos.Api.Models 
{
    public class ConteoRequest
    {
        public int OtherUserId { get; set; }
        public DateTime UltimoAcceso { get; set; }
    }
}