using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Net;
using System.Net.Mail;
using Klinos.Api.Data;
using Klinos.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace Klinos.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly KlinosDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(KlinosDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            string emailLimpio = request.Email?.Trim().ToLower() ?? "";

            // ==========================================
            // 1. INTENTAR INICIAR SESIÓN COMO DOCTOR
            // ==========================================
            var doctor = await _context.Doctores
                .FirstOrDefaultAsync(d => d.Email == emailLimpio);

            if (doctor != null && BCrypt.Net.BCrypt.Verify(request.Password, doctor.Password_Hash))
            {
                var clinicaDoc = await _context.Set<Clinica>().FindAsync(doctor.Clinica_ID);
                string nombreClinicaDoc = clinicaDoc != null ? clinicaDoc.Nombre_Clinica : "Klinos Especialidades Médicas";

                var claimsDoctor = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, doctor.Id.ToString()),
                    new Claim(ClaimTypes.Email, doctor.Email),
                    new Claim(ClaimTypes.Name, doctor.Nombre_Completo),
                    new Claim("ClinicaNombre", nombreClinicaDoc),
                    new Claim("rol", "Doctor") // Clave para React
                };

                return Ok(new { token = GenerarTokenJWT(claimsDoctor) });
            }

            // ==========================================
            // 2. INTENTAR INICIAR SESIÓN COMO PACIENTE
            // ==========================================
            var paciente = await _context.Pacientes
                .FirstOrDefaultAsync(p => p.Email == emailLimpio);

            if (paciente != null && BCrypt.Net.BCrypt.Verify(request.Password, paciente.Password_Hash))
            {
                // VALIDACIÓN DE SEGURIDAD: ¿Ya verificó su correo?
                if (!paciente.IsVerified)
                {
                    return Unauthorized("Debes verificar tu cuenta ingresando el código de 6 dígitos enviado a tu correo antes de iniciar sesión.");
                }

                var clinicaPac = await _context.Set<Clinica>().FindAsync(paciente.Clinica_ID);
                string nombreClinicaPac = clinicaPac != null ? clinicaPac.Nombre_Clinica : "Klinos Especialidades Médicas";

                var claimsPaciente = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, paciente.Id.ToString()),
                    new Claim(ClaimTypes.Email, paciente.Email),
                    new Claim(ClaimTypes.Name, paciente.Nombre_Completo),
                    new Claim("ClinicaNombre", nombreClinicaPac),
                    new Claim("clinicaId", paciente.Clinica_ID.ToString()),
                    new Claim("rol", "Paciente") // Clave para React
                };

                return Ok(new { token = GenerarTokenJWT(claimsPaciente) });
            }

            // Si no coincidió con ninguno
            return Unauthorized("Correo o contraseña incorrectos.");
        }

        // Método auxiliar para evitar repetir código al generar el JWT
        private string GenerarTokenJWT(Claim[] claims)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(8),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpPost("register-paciente")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterPaciente([FromBody] RegisterPacienteRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("El correo y la contraseña son obligatorios.");

            request.Email = request.Email.Trim().ToLower();

            // 1. Verificamos si el correo ya existe en Doctores
            var correoEnDoctores = await _context.Doctores.AnyAsync(d => d.Email == request.Email);
            if (correoEnDoctores)
                return BadRequest("Este correo electrónico ya se encuentra registrado en el sistema.");

            // 2. Verificamos si ya existe en Pacientes
            var pacienteExistente = await _context.Pacientes.FirstOrDefaultAsync(p => p.Email == request.Email);
            if (pacienteExistente != null)
            {
                if (pacienteExistente.IsVerified)
                {
                    // Si ya está verificado, no lo dejamos pasar
                    return BadRequest("Este correo electrónico ya está registrado y verificado.");
                }
                else
                {
                    // 🧹 LIMPIEZA AUTOMÁTICA: Si existe pero NUNCA se verificó, 
                    // eliminamos el registro viejo para dejarle el camino libre.
                    _context.Pacientes.Remove(pacienteExistente);
                    await _context.SaveChangesAsync();
                }
            }

            // 3. Generamos el nuevo código de verificación
            string codigoAleatorio = new Random().Next(100000, 999999).ToString();

            var nuevoPaciente = new Paciente
            {
                Nombre_Completo = request.Nombre_Completo,
                Email = request.Email,
                Password_Hash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Telefono = request.Telefono,
                Clinica_ID = request.Clinica_ID > 0 ? request.Clinica_ID : 1,
                IsVerified = false,
                CodigoVerificacion = codigoAleatorio,
                CodigoExpiracion = DateTime.UtcNow.AddMinutes(10)
            };

            _context.Pacientes.Add(nuevoPaciente);
            await _context.SaveChangesAsync();

            // 4. Enviamos el correo
            try
            {
                await EnviarCorreoVerificacionAsync(request.Email, codigoAleatorio);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al enviar el correo de verificación: {ex.Message}");
            }

            return Ok(new { mensaje = "Registro pendiente. Ingresa el código de 6 dígitos enviado a tu correo." });
        }

        // 2. VALIDAR EL CÓDIGO INGRESADO
        [HttpPost("verificar-codigo")]
        [AllowAnonymous]
        public async Task<IActionResult> VerificarCodigo([FromBody] VerificarCodigoRequest request)
        {
            var paciente = await _context.Pacientes.FirstOrDefaultAsync(p => p.Email == request.Email.Trim().ToLower());

            if (paciente == null)
                return BadRequest("Paciente no encontrado.");

            if (paciente.IsVerified)
                return BadRequest("Esta cuenta ya ha sido verificada.");

            if (paciente.CodigoVerificacion != request.Codigo || paciente.CodigoExpiracion < DateTime.UtcNow)
                return BadRequest("El código es incorrecto o ha expirado.");

            // Activamos la cuenta
            paciente.IsVerified = true;
            paciente.CodigoVerificacion = null;
            paciente.CodigoExpiracion = null;

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "¡Cuenta verificada con éxito! Ya puedes iniciar sesión." });
        }

        // Método auxiliar para enviar correos con SmtpClient
        private async Task EnviarCorreoVerificacionAsync(string destinatario, string codigo)
        {
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:Port"] ?? "587");
            var senderEmail = _config["EmailSettings:SenderEmail"];
            var senderPassword = _config["EmailSettings:SenderPassword"];

            using var client = new SmtpClient(smtpServer, port)
            {
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail!, "KlinOS Seguridad"),
                Subject = "Código de Verificación - KlinOS",
                Body = $"Hola,\n\nTu código de verificación para completar el registro en KlinOS es: {codigo}\n\nEste código expirará en 10 minutos.",
                IsBodyHtml = false
            };

            mailMessage.To.Add(destinatario);
            await client.SendMailAsync(mailMessage);
        }

        [HttpGet("clinicas")]
        [AllowAnonymous]
        public async Task<IActionResult> GetClinicasDisponibles()
        {
            var clinicas = await _context.Clinicas
                .Select(c => new
                {
                    id = c.Id,
                    nombre = c.Nombre_Clinica
                })
                .ToListAsync();

            return Ok(clinicas);
        }

        // 1. SOLICITAR RECUPERACIÓN DE CONTRASEÑA
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest("El correo electrónico es obligatorio.");

            string email = request.Email.Trim().ToLower();

            // Buscamos primero en doctores, si no está, buscamos en pacientes
            var doctor = await _context.Doctores.FirstOrDefaultAsync(d => d.Email == email);
            var paciente = doctor == null ? await _context.Pacientes.FirstOrDefaultAsync(p => p.Email == email) : null;

            if (doctor == null && paciente == null)
            {
                // Por seguridad respondemos genérico, pero para pruebas sabrás que no existe
                return BadRequest("No se encontró ninguna cuenta asociada a este correo.");
            }

            // Generamos código de 6 dígitos
            string codigo = new Random().Next(100000, 999999).ToString();
            var expiracion = DateTime.UtcNow.AddMinutes(15);

            if (doctor != null)
            {
                doctor.CodigoVerificacion = codigo;
                doctor.CodigoExpiracion = expiracion;
            }
            else if (paciente != null)
            {
                paciente.CodigoVerificacion = codigo;
                paciente.CodigoExpiracion = expiracion;
            }

            await _context.SaveChangesAsync();

            // Enviamos el correo reutilizando tu lógica SMTP
            try
            {
                await EnviarCorreoRecuperacionAsync(email, codigo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al enviar el correo: {ex.Message}");
            }

            return Ok(new { mensaje = "Se ha enviado un código de recuperación a tu correo electrónico." });
        }

        // 2. RESTABLECER LA CONTRASEÑA CON EL CÓDIGO
        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Codigo) || string.IsNullOrWhiteSpace(request.NuevoPassword))
                return BadRequest("Todos los campos son obligatorios.");

            string email = request.Email.Trim().ToLower();

            var doctor = await _context.Doctores.FirstOrDefaultAsync(d => d.Email == email);
            var paciente = doctor == null ? await _context.Pacientes.FirstOrDefaultAsync(p => p.Email == email) : null;

            if (doctor == null && paciente == null)
                return BadRequest("Usuario no encontrado.");

            // Validar código y expiración
            string? codigoGuardado = doctor != null ? doctor.CodigoVerificacion : paciente?.CodigoVerificacion;
            DateTime? expiracionGuardada = doctor != null ? doctor.CodigoExpiracion : paciente?.CodigoExpiracion;

            if (codigoGuardado != request.Codigo || expiracionGuardada < DateTime.UtcNow)
            {
                return BadRequest("El código de recuperación es incorrecto o ha expirado.");
            }

            // Encriptamos la nueva contraseña con BCrypt
            string nuevoHash = BCrypt.Net.BCrypt.HashPassword(request.NuevoPassword);

            if (doctor != null)
            {
                doctor.Password_Hash = nuevoHash;
                doctor.CodigoVerificacion = null;
                doctor.CodigoExpiracion = null;
            }
            else if (paciente != null)
            {
                paciente.Password_Hash = nuevoHash;
                paciente.CodigoVerificacion = null;
                paciente.CodigoExpiracion = null;
            }

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "¡Contraseña restablecida con éxito! Ya puedes iniciar sesión." });
        }

        // Método auxiliar para enviar el correo de recuperación
        private async Task EnviarCorreoRecuperacionAsync(string destinatario, string codigo)
        {
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:Port"] ?? "587");
            var senderEmail = _config["EmailSettings:SenderEmail"];
            var senderPassword = _config["EmailSettings:SenderPassword"];

            using var client = new SmtpClient(smtpServer, port)
            {
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail!, "KlinOS Seguridad"),
                Subject = "Recuperación de Contraseña - KlinOS",
                Body = $"Hola,\n\nHas solicitado restablecer tu contraseña. Tu código de verificación es: {codigo}\n\nEste código expirará en 15 minutos. Si no solicitaste esto, ignora este mensaje.",
                IsBodyHtml = false
            };

            mailMessage.To.Add(destinatario);
            await client.SendMailAsync(mailMessage);
        }


    }


}

public class RegisterPacienteRequest
{
    public string Nombre_Completo { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public int Clinica_ID { get; set; } = 1;
}

// DTOs auxiliares necesarios para las peticiones
public class VerificarCodigoRequest
{
    public string Email { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
}

// DTOs auxiliares Recuperación de contraseña
public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string NuevoPassword { get; set; } = string.Empty;
}