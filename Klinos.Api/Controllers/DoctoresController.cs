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
    public class DoctoresController : ControllerBase
    {
        private readonly KlinosDbContext _context;

        public DoctoresController(KlinosDbContext context)
        {
            _context = context;
        }

        // POST: api/Doctores
        [AllowAnonymous]
        [HttpPost]
        public async Task<IActionResult> RegistrarDoctor(Doctor doctor)
        {
            // 1. Validar duplicidad de usuario (Ajusta 'Email' al nombre real de tu propiedad)
            var correoExiste = await _context.Doctores.AnyAsync(d => d.Email == doctor.Email);
            if (correoExiste)
            {
                return BadRequest(new { mensaje = "El correo electrónico ya está registrado en el sistema." });
            }

            // 2. Validar existencia de la clínica
            var clinicaExiste = await _context.Clinicas.AnyAsync(c => c.Id == doctor.Clinica_ID);
            if (!clinicaExiste)
            {
                return BadRequest(new { mensaje = "La clínica especificada no existe en el sistema." });
            }

            // 3. Encriptar contraseña y guardar
            doctor.Password_Hash = BCrypt.Net.BCrypt.HashPassword(doctor.Password_Hash);
            _context.Doctores.Add(doctor);
            await _context.SaveChangesAsync();

            // 4. Retornar un objeto anónimo (Seguro, sin el hash)
            var doctorSeguro = new
            {
                id = doctor.Id,
                nombre_Completo = doctor.Nombre_Completo,
                email = doctor.Email,
                clinica_ID = doctor.Clinica_ID
            };

            return CreatedAtAction(nameof(ObtenerDoctor), new { id = doctor.Id }, doctorSeguro);
        }

        // GET: api/Doctores/5
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerDoctor(int id)
        {
            // Proyección directa a la BD: Solo extraemos los datos seguros, ahorrando RAM.
            var doctor = await _context.Doctores
                .Where(d => d.Id == id)
                .Select(d => new
                {
                    id = d.Id,
                    nombre_Completo = d.Nombre_Completo,
                    especialidad = d.Especialidad,
                    email = d.Email,
                    clinica_ID = d.Clinica_ID
                })
                .FirstOrDefaultAsync();

            if (doctor == null)
            {
                return NotFound(new { mensaje = "Doctor no encontrado." });
            }

            return Ok(doctor);
        }

        // GET: api/Doctores/Clinica/1
        [HttpGet("Clinica/{clinicaId}")]
        public async Task<IActionResult> ObtenerDoctoresPorClinica(int clinicaId)
        {
            // Filtramos y proyectamos sin traer los Password_Hash
            var doctores = await _context.Doctores
                .Where(d => d.Clinica_ID == clinicaId)
                .Select(d => new
                {
                    id = d.Id,
                    nombre_Completo = d.Nombre_Completo,
                    especialidad = d.Especialidad,
                    email = d.Email
                })
                .ToListAsync();

            return Ok(doctores);
        }
    }
}