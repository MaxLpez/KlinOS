using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Klinos.Api.Data;
using Klinos.Api.Models; // Asegúrate de que apunte a donde tienes tu clase Publicacion
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace Klinos.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PublicacionesController : ControllerBase
    {
        private readonly KlinosDbContext _context;

        public PublicacionesController(KlinosDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // GET: Para el muro del paciente (Lectura)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetPublicaciones()
        {
// Hacemos el Left Join con la tabla de Doctores para garantizar el nombre
    var publicaciones = await _context.Publicaciones
        .GroupJoin(
            _context.Set<Doctor>(), // Relacionamos con la tabla Doctores
            p => p.Doctor_ID,       // FK en la Publicación
            d => d.Id,              // PK en el Doctor
            (p, doctores) => new { p, doctores }
        )
        .SelectMany(
            x => x.doctores.DefaultIfEmpty(),
            (x, doctor) => new {
                id = x.p.Id,
                titulo = x.p.Titulo,
                tipo = x.p.Tipo,
                contenido = x.p.Contenido,
                fechaPublicacion = x.p.Fecha_Publicacion, // O Fecha_Creacion, según tu modelo
                
                // 🌟 Aquí está la magia que previene el error
                doctorNombre = doctor != null ? doctor.Nombre_Completo : "Especialista"
            }
        )
        .OrderByDescending(p => p.fechaPublicacion)
        .ToListAsync();

    return Ok(publicaciones);
        }

        // ==========================================
        // POST: Para el panel del doctor (Creación)
        // ==========================================
        [Authorize(Roles = "Doctor")] // Solo doctores pueden crear publicaciones
        [HttpPost]
        public async Task<IActionResult> CrearPublicacion([FromBody] Publicacion nuevaPublicacion)
        {
            if (nuevaPublicacion == null)
                return BadRequest("Datos inválidos.");

            // Forzamos la fecha y hora exacta del servidor en el momento de publicar
            nuevaPublicacion.Fecha_Publicacion = DateTime.UtcNow;

            _context.Publicaciones.Add(nuevaPublicacion);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Publicación creada con éxito", id = nuevaPublicacion.Id });
        }
    }
}