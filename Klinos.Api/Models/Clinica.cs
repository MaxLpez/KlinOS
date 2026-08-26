using System;

namespace Klinos.Api.Models
{
    public class Clinica
    {
        public int Id { get; set; }
        public string Nombre_Clinica { get; set; } = string.Empty;
        public string Subdominio_URL { get; set; } = string.Empty;
        public string? Ruta_Local_Logo { get; set; }
        public string? Telefono_Contacto { get; set; }
        public DateTime Fecha_Registro { get; set; } = DateTime.UtcNow;

        public string Email_Administrador { get; set; } = string.Empty;
        public string Password_Hash { get; set; } = string.Empty;

        // Al registrarse, sumamos automáticamente 30 días a partir de hoy
        public DateTime Fecha_Fin_Suscripcion { get; set; } = DateTime.UtcNow.AddDays(30);

        public string Numero_Licencia { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(); // Ej: 8F3A2B1C9D
        public string Metodo_Pago { get; set; } = "Prueba Gratuita";
        public bool Suscripcion_Cancelada { get; set; } = false;
        // Propiedad calculada: ¿Aún tiene acceso?
        public bool Suscripcion_Activa => !Suscripcion_Cancelada && DateTime.UtcNow <= Fecha_Fin_Suscripcion;
    }
}