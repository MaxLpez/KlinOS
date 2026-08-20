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
    public class CitasController : ControllerBase
    {
        private readonly KlinosDbContext _context;

        public CitasController(KlinosDbContext context)
        {
            _context = context;
        }

        // POST: api/Citas
        [Authorize(Roles = "Doctor")]
        [HttpPost]
        public async Task<IActionResult> CrearCita(Cita nuevaCita)
        {
            if (nuevaCita.Paciente_ID <= 0)
            {
                return BadRequest(new { mensaje = "El ID del paciente es inválido." });
            }

            // Desvinculamos las navegaciones
            nuevaCita.Paciente = null!; 

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int doctorId)) return Unauthorized(new { mensaje = "Token inválido." });

            var doctorInfo = await _context.Set<Doctor>().FindAsync(doctorId);
            if (doctorInfo == null) return NotFound(new { mensaje = "No se encontró el doctor en la base de datos." });

            // Forzamos la seguridad del backend
            nuevaCita.Doctor_ID = doctorId;
            nuevaCita.Clinica_ID = doctorInfo.Clinica_ID;
            
            // Aseguramos estado inicial si no viene definido
            if (string.IsNullOrEmpty(nuevaCita.Estado))
            {
                nuevaCita.Estado = "Pendiente";
            }

            _context.Citas.Add(nuevaCita);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Cita agendada correctamente", id = nuevaCita.Id });
        }

        // GET: api/Citas/MisCitas (Para el Doctor - OPTIMIZADO CON DTO)
        [Authorize(Roles = "Doctor")]
        [HttpGet("MisCitas")]
        public async Task<IActionResult> ObtenerMisCitas()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int doctorId)) return Unauthorized(new { mensaje = "Token inválido." });

            // Usamos proyección para evitar exponer datos sensibles del paciente y asegurar nombres limpios
            var citas = await _context.Citas
                .Where(c => c.Doctor_ID == doctorId)
                .GroupJoin(
                    _context.Pacientes,
                    c => c.Paciente_ID,
                    p => p.Id,
                    (c, pacientes) => new { c, pacientes }
                )
                .SelectMany(
                    x => x.pacientes.DefaultIfEmpty(),
                    (x, paciente) => new {
                        id = x.c.Id,
                        pacienteId = x.c.Paciente_ID,
                        paciente = paciente != null ? new {
                            id = paciente.Id,
                            nombre_Completo = paciente.Nombre_Completo
                        } : null,
                        fecha_Hora = x.c.Fecha_Hora,
                        motivo_Consulta = x.c.Motivo_Consulta,
                        estado = x.c.Estado
                    }
                )
                .OrderBy(c => c.fecha_Hora)
                .ToListAsync();

            return Ok(citas);
        }

        // GET: api/Citas/MisCitasPaciente (Obtiene las citas del paciente logueado)
        [Authorize(Roles = "Paciente")]
        [HttpGet("MisCitasPaciente")]
        public async Task<IActionResult> ObtenerMisCitasPaciente()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int pacienteId)) return Unauthorized(new { mensaje = "Token inválido." });

            var citas = await _context.Citas
                .Where(c => c.Paciente_ID == pacienteId)
                .GroupJoin(
                    _context.Doctores,
                    c => c.Doctor_ID,
                    d => d.Id,
                    (c, doctores) => new { c, doctores }
                )
                .SelectMany(
                    x => x.doctores.DefaultIfEmpty(),
                    (x, doctor) => new { 
                        id = x.c.Id,
                        doctorId = x.c.Doctor_ID,
                        doctorNombre = doctor != null ? doctor.Nombre_Completo : "Especialista",
                        motivo = x.c.Motivo_Consulta,
                        fechaHora = x.c.Fecha_Hora,
                        estado = x.c.Estado
                    }
                )
                .OrderByDescending(c => c.fechaHora)
                .ToListAsync();

            return Ok(citas);
        }

        // PUT: api/Citas/5/MarcarAtendida
        [Authorize(Roles = "Doctor")] 
        [HttpPut("{id:int}/MarcarAtendida")]
        public async Task<IActionResult> MarcarComoAtendida(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int doctorId)) return Unauthorized(new { mensaje = "Token inválido." });

            var cita = await _context.Citas
                .FirstOrDefaultAsync(c => c.Id == id && c.Doctor_ID == doctorId);
            
            if (cita == null)
            {
                return NotFound(new { mensaje = "Cita no encontrada o no tienes permisos para modificarla." });
            }

            cita.Estado = "Atendida";
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Cita marcada como atendida." });
        }
    }
}