import { useState, useEffect } from 'react';
import axios from 'axios';
import ChatVentana from './ChatVentana';

export default function ChatFlotante({ clinicaId, doctorId, pacienteId, nombreDoctor }) {
  const [abierto, setAbierto] = useState(false);
  const [noLeidos, setNoLeidos] = useState(0);

  // Efecto silencioso para revisar si hay mensajes nuevos
// Efecto silencioso para revisar si hay mensajes nuevos
  useEffect(() => {

    if (abierto) {
      setNoLeidos(0); // Si abro el chat, los leo todos
      return;
    }

    const revisarMensajesNuevos = async () => {
      // Nos aseguramos de que el ID sea un número válido
      const idSeguro = Number(doctorId) || 0;
      
      if (idSeguro === 0) {
        return; 
      }

      try {
        const ultimoAcceso = localStorage.getItem('ultimoAccesoChat') || '2000-01-01T00:00:00';
        const token = localStorage.getItem('token');

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/Chat/ConteoNuevos`,
          { otherUserId: idSeguro, ultimoAcceso: ultimoAcceso },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log(`[ChatFlotante] Buscando msjs tras ${ultimoAcceso}. C# respondió:`, res.data.nuevos);
        setNoLeidos(res.data.nuevos);
      } catch (error) {
        console.error("Error al contar mensajes:", error);
      }
    };

    // Revisa inmediatamente al cargar, y luego cada 10 segundos
    revisarMensajesNuevos();
    const intervalo = setInterval(revisarMensajesNuevos, 10000);

    return () => clearInterval(intervalo);
  }, [abierto, doctorId]);


  return (
    <div style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 9999 }}>
      {abierto ? (
        <div style={{ width: '350px', height: '500px', borderRadius: '8px', overflow: 'hidden' }}>
          <ChatVentana
            clinicaId={clinicaId}
            doctorId={doctorId}
            pacienteId={pacienteId}
            remitente="Paciente"
            nombreContraparte={nombreDoctor}
            onClose={() => setAbierto(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => {
            setAbierto(true);
            setNoLeidos(0);
          }}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#27ae60',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            fontSize: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          💬
          {/* EL CONTADOR ROJO (Solo se dibuja si hay más de 0 mensajes) */}
          {noLeidos > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#e74c3c',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              animation: 'pulse 1.5s infinite'
            }}>
              {noLeidos}
            </span>
          )}
        </button>
      )}
    </div>
  );
}