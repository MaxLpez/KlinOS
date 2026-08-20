using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Klinos.Api.Data;
using Klinos.Api.Models;
using Microsoft.AspNetCore.Authorization;

namespace Klinos.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ClinicasController : ControllerBase
    {
        private readonly KlinosDbContext _context;

        // 1. Constructor: Solo sirve para inyectar la conexión a SQL Server
        public ClinicasController(KlinosDbContext context)
        {
            _context = context;
        }

        // 2. POST: Endpoint para Registrar una nueva clínica
        [HttpPost]
        public async Task<ActionResult<Clinica>> RegistrarClinica(Clinica clinica)
        {
            clinica.Fecha_Registro = DateTime.UtcNow; 
            
            _context.Clinicas.Add(clinica);
            await _context.SaveChangesAsync();

            // Devuelve un código 201 y el registro creado
            return CreatedAtAction(nameof(ObtenerClinica), new { id = clinica.Id }, clinica);
        }

        // 3. GET: Endpoint para Consultar una clínica por su ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Clinica>> ObtenerClinica(int id)
        {
            var clinica = await _context.Clinicas.FindAsync(id);

            if (clinica == null)
            {
                return NotFound();
            }

            return clinica;
        }
    }
}