using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Klinos.Api.Data;
using Klinos.Api.Models;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;

namespace Klinos.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PacientesController : ControllerBase
    {
        private readonly KlinosDbContext _context;

        public PacientesController(KlinosDbContext context)
        {
            _context = context;
        }

        // POST: api/Pacientes (Dar de alta a un paciente)
        [AllowAnonymous] // Asumiendo que el paciente se puede registrar a sí mismo (quítalo si solo el doctor puede)
        [HttpPost]
        public async Task<IActionResult> RegistrarPaciente(Paciente paciente)
        {
            // 1. Validar que el correo no esté duplicado
            var correoExiste = await _context.Pacientes.AnyAsync(p => p.Email == paciente.Email);
            if (correoExiste)
            {
                return BadRequest(new { mensaje = "Este correo electrónico ya está registrado." });
            }

            // 2. Validar que la clínica exista
            var clinicaExiste = await _context.Clinicas.AnyAsync(c => c.Id == paciente.Clinica_ID);
            if (!clinicaExiste)
            {
                return BadRequest(new { mensaje = "La clínica especificada no existe en el sistema." });
            }

            // 3. Encriptar contraseña y guardar
            paciente.Password_Hash = BCrypt.Net.BCrypt.HashPassword(paciente.Password_Hash);

            _context.Pacientes.Add(paciente);
            await _context.SaveChangesAsync();

            // 4. Retornar DTO seguro
            var pacienteSeguro = new
            {
                id = paciente.Id,
                nombre_Completo = paciente.Nombre_Completo,
                email = paciente.Email,
                clinica_ID = paciente.Clinica_ID
            };

            return CreatedAtAction(nameof(ObtenerPaciente), new { id = paciente.Id }, pacienteSeguro);
        }

        // GET: api/Pacientes (Consultar todos los pacientes)
        [HttpGet]
        public async Task<IActionResult> ObtenerTodosLosPacientes()
        {
            // PROYECCIÓN DIRECTA: Más rápido, menos RAM, cero riesgo de sobreescribir contraseñas.
            var pacientes = await _context.Pacientes
                .Select(p => new
                {
                    id = p.Id,
                    nombre_Completo = p.Nombre_Completo,
                    email = p.Email,
                    clinica_ID = p.Clinica_ID
                })
                .ToListAsync();

            return Ok(pacientes);
        }

        // GET: api/Pacientes/5 (Consultar un paciente específico)
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPaciente(int id)
        {
            var paciente = await _context.Pacientes
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    id = p.Id,
                    nombre_Completo = p.Nombre_Completo,
                    email = p.Email,
                    fecha_Nacimiento = p.Fecha_Nacimiento, // (Ajusta al nombre real si lo tienes)
                    telefono = p.Telefono,                 // (Ajusta al nombre real si lo tienes)
                    clinica_ID = p.Clinica_ID
                })
                .FirstOrDefaultAsync();

            if (paciente == null)
            {
                return NotFound(new { mensaje = "Paciente no encontrado." });
            }

            return Ok(paciente);
        }

        // GET: api/Pacientes/Clinica/1 (Consultar todos los pacientes de una clínica)
        [HttpGet("Clinica/{clinicaId}")]
        public async Task<IActionResult> ObtenerPacientesPorClinica(int clinicaId)
        {
            var pacientes = await _context.Pacientes
                .Where(p => p.Clinica_ID == clinicaId)
                .Select(p => new
                {
                    id = p.Id,
                    nombre_Completo = p.Nombre_Completo,
                    email = p.Email,
                    clinica_ID = p.Clinica_ID
                })
                .ToListAsync();

            return Ok(pacientes);
        }
    }
}