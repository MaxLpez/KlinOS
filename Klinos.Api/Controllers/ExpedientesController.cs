using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Klinos.Api.Data;
using Klinos.Api.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Klinos.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ExpedientesController : ControllerBase
    {
        private readonly KlinosDbContext _context;

        public ExpedientesController(KlinosDbContext context)
        {
            _context = context;
        }

        // 1. Crear el expediente base
        [Authorize(Roles = "Doctor")]
        [HttpPost]
        public async Task<IActionResult> CrearExpediente(ExpedienteMedico nuevoExpediente)
        {
            if (nuevoExpediente.Paciente_ID <= 0)
                return BadRequest(new { mensaje = "El ID del paciente es inválido." });

            // Desvinculamos las propiedades de navegación para que Entity Framework no intente crearlas de nuevo
            nuevoExpediente.Paciente = null;
            nuevoExpediente.Doctor = null;
            nuevoExpediente.Clinica = null;
            nuevoExpediente.Archivos = null;

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int doctorId)) return Unauthorized();

            var doctorInfo = await _context.Set<Doctor>().FindAsync(doctorId);
            if (doctorInfo == null) return NotFound(new { mensaje = "Doctor no encontrado." });

            // Forzamos los datos de seguridad
            nuevoExpediente.Doctor_ID = doctorId;
            nuevoExpediente.Clinica_ID = doctorInfo.Clinica_ID;
            
            // Si la fecha de consulta no se envió desde React, aseguramos que tenga la hora actual
            if (nuevoExpediente.Fecha_Consulta == default)
            {
                nuevoExpediente.Fecha_Consulta = DateTime.UtcNow;
            }

            _context.Set<ExpedienteMedico>().Add(nuevoExpediente);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Expediente creado correctamente", id = nuevoExpediente.Id });
        }

        // 2. Subir el archivo físico
        [Authorize(Roles = "Doctor")]
        [HttpPost("{expedienteId}/SubirEstudio")]
        public async Task<IActionResult> SubirEstudio(int expedienteId, IFormFile archivo)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int doctorId)) return Unauthorized();

            var expediente = await _context.Set<ExpedienteMedico>().FindAsync(expedienteId);
            if (expediente == null) return NotFound(new { mensaje = "Expediente no encontrado." });

            // 🛡️ BLINDAJE IDOR
            if (expediente.Doctor_ID != doctorId)
                return Forbid("No tienes permiso para modificar un expediente de otro médico.");

            if (archivo == null || archivo.Length == 0) 
                return BadRequest(new { mensaje = "No se proporcionó un archivo válido." });

            // Filtro de seguridad para archivos
            var extensionesPermitidas = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
            var extensionArchivo = Path.GetExtension(archivo.FileName).ToLower();
            if (!extensionesPermitidas.Contains(extensionArchivo))
                return BadRequest(new { mensaje = "Formato de archivo no permitido. Usa PDF, JPG o PNG." });

            var carpetaDestino = Path.Combine("AlmacenamientoLocal", $"Clinica_{expediente.Clinica_ID}", $"Paciente_{expediente.Paciente_ID}");
            Directory.CreateDirectory(carpetaDestino);

            var nombreUnico = Guid.NewGuid().ToString() + extensionArchivo;
            var rutaCompleta = Path.Combine(carpetaDestino, nombreUnico);

            using (var stream = new FileStream(rutaCompleta, FileMode.Create))
            {
                await archivo.CopyToAsync(stream);
            }

            var nuevoArchivo = new ArchivoEstudio
            {
                Expediente_ID = expedienteId,
                Nombre_Original = archivo.FileName,
                Ruta_Archivo = rutaCompleta,
                Tipo_Archivo = archivo.ContentType,
                Tamano_MB = (decimal)archivo.Length / (1024 * 1024),
                Fecha_Subida = DateTime.UtcNow
            };

            _context.Set<ArchivoEstudio>().Add(nuevoArchivo);
            await _context.SaveChangesAsync();

            return Ok(new { 
                id = nuevoArchivo.Id, 
                nombre = nuevoArchivo.Nombre_Original, 
                fecha = nuevoArchivo.Fecha_Subida 
            });
        }

        // 3. Obtener la lista de expedientes de un doctor
        [Authorize(Roles = "Doctor")]
        [HttpGet("MisExpedientes")]
        public async Task<IActionResult> ObtenerMisExpedientes()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int doctorId)) return Unauthorized();

            // 🛡️ DTO OPTIMIZADO: Ahora usando tus propiedades exactas (Diagnostico, Recomendaciones, Fecha_Consulta)
            var expedientes = await _context.Set<ExpedienteMedico>()
                .Where(e => e.Doctor_ID == doctorId)
                .OrderByDescending(e => e.Fecha_Consulta)
                .Select(e => new
                {
                    id = e.Id,
                    diagnostico = e.Diagnostico,
                    recomendaciones = e.Recomendaciones,
                    fechaConsulta = e.Fecha_Consulta,
                    paciente = new 
                    {
                        id = e.Paciente!.Id,
                        nombre_Completo = e.Paciente.Nombre_Completo
                    },
                    archivos = e.Archivos!.Select(a => new {
                        id = a.Id,
                        nombre_Original = a.Nombre_Original,
                        tamano_MB = Math.Round(a.Tamano_MB?? 0m, 2)
                    })
                })
                .ToListAsync();

            return Ok(expedientes);
        }

        // 4. Descargar el archivo físico
        [HttpGet("Descargar/{archivoId}")]
        public async Task<IActionResult> DescargarArchivo(int archivoId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = User.FindFirst("rol")?.Value ?? User.FindFirst(ClaimTypes.Role)?.Value;

            if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

            // Incluimos el expediente para verificar la propiedad
            var archivo = await _context.Set<ArchivoEstudio>()
                .Include(a => a.Expediente) // <--- Asumiendo que la propiedad de navegación en ArchivoEstudio se llama 'Expediente'
                .FirstOrDefaultAsync(a => a.Id == archivoId);

            if (archivo == null || archivo.Expediente == null) 
                return NotFound(new { mensaje = "El archivo no existe." });

            // 🛡️ BLINDAJE IDOR
            if (userRole == "Doctor" && archivo.Expediente.Doctor_ID != userId)
                return Forbid("No tienes acceso a los archivos de este paciente.");
                
            if (userRole == "Paciente" && archivo.Expediente.Paciente_ID != userId)
                return Forbid("No tienes acceso a este archivo.");

            var rutaFisica = archivo.Ruta_Archivo;
            if (!System.IO.File.Exists(rutaFisica)) 
                return NotFound(new { mensaje = "El archivo físico no se encontró en el disco." });

            var proveedor = new FileExtensionContentTypeProvider();
            if (!proveedor.TryGetContentType(rutaFisica, out string? tipoContenido) || tipoContenido == null)
            {
                tipoContenido = "application/octet-stream";
            }

            // 🛡️ PROTECCIÓN DE RAM
            var rutaAbsoluta = Path.GetFullPath(rutaFisica);
            return PhysicalFile(rutaAbsoluta, tipoContenido, archivo.Nombre_Original);
        }
    }
}