using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Klinos.Api.Data;
using Klinos.Api.Models;
using System;
using System.Threading.Tasks;

namespace Klinos.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly KlinosDbContext _context;

        public ChatHub(KlinosDbContext context)
        {
            _context = context;
        }

        // Genera un identificador único de sala para este trío (Clínica, Doctor, Paciente)
        private static string ObtenerNombreGrupo(int clinicaId, int doctorId, int pacienteId)
            => $"Chat_{clinicaId}_{doctorId}_{pacienteId}";

        // MÉTODO 1: Para que el usuario entre a su "sala privada"
        public async Task UnirseAlChat(int clinicaId, int doctorId, int pacienteId)
        {
            string grupo = ObtenerNombreGrupo(clinicaId, doctorId, pacienteId);
            await Groups.AddToGroupAsync(Context.ConnectionId, grupo);
        }

        // MÉTODO 2: El que React está intentando llamar (¡El que faltaba!)
        public async Task EnviarMensaje(int clinicaId, int doctorId, int pacienteId, string remitente, string texto)
        {
            if (string.IsNullOrWhiteSpace(texto)) return;

            // 1. Guardar en Base de Datos
            var nuevoMensaje = new ChatMensaje
            {
                Clinica_ID = clinicaId,
                Doctor_ID = doctorId,
                Paciente_ID = pacienteId,
                Enviado_Por = remitente,
                Mensaje_Texto = texto,
                Fecha_Envio = DateTime.UtcNow,
                Leido = false
            };

            _context.ChatMensajes.Add(nuevoMensaje);
            await _context.SaveChangesAsync();

            // 2. Transmitir en tiempo real a los integrantes del grupo
            string grupo = ObtenerNombreGrupo(clinicaId, doctorId, pacienteId);
            await Clients.Group(grupo).SendAsync("RecibirMensaje", nuevoMensaje);
        }
    }
}