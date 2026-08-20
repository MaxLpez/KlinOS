import { useState } from 'react';
import ChatVentana from './ChatVentana';

export default function PanelChatDoctor({ clinicaId, doctorId, listaPacientes }) {
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [filtro, setFiltro] = useState('');

  const pacientesFiltrados = listaPacientes.filter(p =>
    (p.nombre_Completo || p.nombre || '').toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: '600px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Columna Izquierda: Lista de Pacientes */}
      <div style={{ width: '35%', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
        <div style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
          <input
            type="text"
            placeholder="🔍 Buscar paciente..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {pacientesFiltrados.map((p) => {
            const id = p.id || p.paciente_ID;
            const nombre = p.nombre_Completo || p.nombre || `Paciente #${id}`;
            const activo = pacienteSeleccionado?.id === id;

            return (
              <div
                key={id}
                onClick={() => setPacienteSeleccionado({ id, nombre })}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f5f5f5',
                  cursor: 'pointer',
                  backgroundColor: activo ? '#ebebeb' : '#fff'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>👤 {nombre}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>ID: {id}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Columna Derecha: Chat Activo */}
      <div style={{ width: '65%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
        {pacienteSeleccionado ? (
          <div style={{ width: '100%', height: '100%' }}>
            <ChatVentana
              clinicaId={clinicaId}
              doctorId={doctorId}
              pacienteId={pacienteSeleccionado.id}
              remitente="Doctor"
              nombreContraparte={pacienteSeleccionado.nombre}
            />
          </div>
        ) : (
          <div style={{ color: '#888', textAlign: 'center' }}>
            <h3>💬 Panel de Mensajería</h3>
            <p>Selecciona un paciente a la izquierda para iniciar la conversación en tiempo real.</p>
          </div>
        )}
      </div>
    </div>
  );
}