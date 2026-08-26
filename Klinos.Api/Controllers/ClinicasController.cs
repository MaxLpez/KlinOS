using System;
using System.IO;
using System.Linq; // 👈 Importante para poder usar .Any()
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Klinos.Api.Data;
using Klinos.Api.Models;

namespace Klinos.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ClinicasController : ControllerBase
    {
        private readonly KlinosDbContext _context;

        public ClinicasController(KlinosDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // 1. OBTENER CLÍNICA (Público para Landing Page)
        // ==========================================
        [AllowAnonymous] // 👈 EVITA EL BUCLE INFINITO EN REACT
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerClinica(int id)
        {
            var clinica = await _context.Clinicas.FindAsync(id);
            if (clinica == null) return NotFound(new { mensaje = "Clínica no encontrada." });
            
            return Ok(clinica);
        }

        // ==========================================
        // 2. REGISTRAR NUEVA CLÍNICA (SaaS - Causa del error 405 resuelta)
        // ==========================================
        [AllowAnonymous]
        [HttpPost("Registro")]
        public async Task<IActionResult> RegistrarClinica([FromBody] RegistroClinicaDTO dto)
        {
            // 1. Verificamos que el correo no exista ya
            var existe = _context.Clinicas.Any(c => c.Email_Administrador == dto.Email_Administrador);
            if (existe) return BadRequest(new { mensaje = "Este correo ya está registrado en otra clínica." });

            // 2. Creamos la clínica
            var nuevaClinica = new Clinica
            {
                Nombre_Clinica = dto.Nombre_Clinica,
                Email_Administrador = dto.Email_Administrador,
                Password_Hash = BCrypt.Net.BCrypt.HashPassword(dto.Password) 
                // La Fecha_Fin_Suscripcion a 30 días se pone sola por tu Modelo
            };

            _context.Clinicas.Add(nuevaClinica);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "¡Clínica registrada con éxito! Tu mes de prueba ha comenzado." });
        }

        // ==========================================
        // 3. ACTUALIZAR CONFIGURACIÓN Y LOGO
        // ==========================================
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarConfiguracion(
            int id, 
            [FromForm] string? nombre_Clinica, 
            [FromForm] string? telefono_Contacto, 
            [FromForm] string? subdominio_URL, 
            IFormFile? logo)
        {
            var clinica = await _context.Clinicas.FindAsync(id);
            if (clinica == null) return NotFound(new { mensaje = "Clínica no encontrada." });

            if (!string.IsNullOrEmpty(nombre_Clinica)) clinica.Nombre_Clinica = nombre_Clinica;
            if (!string.IsNullOrEmpty(telefono_Contacto)) clinica.Telefono_Contacto = telefono_Contacto;
            if (!string.IsNullOrEmpty(subdominio_URL)) clinica.Subdominio_URL = subdominio_URL;

            if (logo != null && logo.Length > 0)
            {
                var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "AlmacenamientoLocal", "Logos");
                if (!Directory.Exists(folderPath)) Directory.CreateDirectory(folderPath);

                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(logo.FileName);
                var filePath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await logo.CopyToAsync(stream);
                }

                clinica.Ruta_Local_Logo = $"/api/Clinicas/Logo/{fileName}"; 
            }

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Configuración actualizada correctamente.", clinica });
        }

        // ==========================================
        // 4. OBTENER LOGO (Público)
        // ==========================================
        [AllowAnonymous]
        [HttpGet("Logo/{fileName}")]
        public IActionResult ObtenerLogo(string fileName)
        {
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "AlmacenamientoLocal", "Logos", fileName);
            if (!System.IO.File.Exists(filePath)) return NotFound();
            
            return PhysicalFile(filePath, "image/jpeg");
        }

        // POST: api/Clinicas/1/cancelar-suscripcion
        [HttpPost("{id}/cancelar-suscripcion")]
        public async Task<IActionResult> CancelarSuscripcion(int id)
        {
            var clinica = await _context.Clinicas.FindAsync(id);
            if (clinica == null) return NotFound(new { mensaje = "Clínica no encontrada." });

            clinica.Suscripcion_Cancelada = true;
            // Opcional: Eliminar los días restantes para corte inmediato
            // clinica.Fecha_Fin_Suscripcion = DateTime.UtcNow; 

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Tu suscripción ha sido cancelada. Perderás el acceso al terminar tu periodo actual." });
        }
    }

    // ==========================================
    // DTO PARA EL REGISTRO
    // ==========================================
    public class RegistroClinicaDTO
    {
        public string Nombre_Clinica { get; set; } = string.Empty;
        public string Email_Administrador { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}