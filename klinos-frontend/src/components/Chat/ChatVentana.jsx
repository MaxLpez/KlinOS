import { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import axios from 'axios';
import jsPDF from 'jspdf';

export default function ChatVentana({ clinicaId, doctorId, pacienteId, remitente, nombreContraparte, onClose }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const chatRef = useRef(null);

  // Referencia para la conexión actual
  const connectionRef = useRef(null);

  // Estados para el Modal de la Receta
  const [mostrarModalReceta, setMostrarModalReceta] = useState(false);
  const [textoReceta, setTextoReceta] = useState('');

  // Extracción de Nombres desde el JWT para el PDF (VERSIÓN UTF-8)
  const obtenerDatosDelToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { doctor: 'Médico Tratante', clinica: 'Clínica Klinos' };
      
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      const jsonPayload = decodeURIComponent(
        window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      
      const payload = JSON.parse(jsonPayload);

      return {
        doctor: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] 
             || payload.unique_name 
             || payload.name 
             || payload.nombre
             || payload.Nombre_Completo
             || 'Médico Tratante',
             
        clinica: payload.ClinicaNombre
              || payload.clinicaNombre
              || payload.clinica
              || payload.nombreClinica
              || 'Klinos Especialidades Médicas' 
      };
    } catch (e) {
      console.error("Error al decodificar token:", e);
      return { doctor: 'Médico Tratante', clinica: 'Clínica Klinos' };
    }
  };

  // 1. Cargar historial y conectar SignalR de forma totalmente limpia al cambiar de chat
  useEffect(() => {
    
    if (!pacienteId || pacienteId === 0) return;

    let isSubscribed = true;
    const token = localStorage.getItem('token'); 

    // Determinamos inteligentemente quién es la contraparte para el historial
    const idContraparte = remitente === 'Doctor' ? pacienteId : doctorId;

    // Cargar Historial
    const cargarHistorial = async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/Chat/Historial`,
          { otherUserId: Number(idContraparte) },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (isSubscribed) {
          setMensajes(res.data);
        }
      } catch (error) {
        console.error("Error al cargar historial:", error);
      }
    };

    cargarHistorial();

    // Crear una NUEVA conexión limpia para este chat específico
    const nuevaConexion = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL}/chatHub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = nuevaConexion;

    const iniciarSignalR = async () => {
      try {
        await nuevaConexion.start();
        if (isSubscribed) {
          console.log("Conexión SignalR iniciada correctamente para el chat");

          // Unirse al grupo de chat específico
          await nuevaConexion.invoke("UnirseAlChat", Number(clinicaId), Number(doctorId), Number(pacienteId));

          // Escuchar nuevos mensajes en tiempo real
          nuevaConexion.off("RecibirMensaje");
          nuevaConexion.on("RecibirMensaje", (mensajeNuevo) => {
            if (isSubscribed) {
              setMensajes(prev => [...prev, mensajeNuevo]);
            }
          });
        }
      } catch (err) {
        if (isSubscribed) {
          console.error("Error al conectar SignalR:", err);
        }
      }
    };

    iniciarSignalR();

    // Cleanup: Al cambiar de chat o cerrar, detenemos la conexión anterior por completo
    return () => {
      isSubscribed = false;
      if (nuevaConexion) {
        nuevaConexion.stop();
      }
    };
  }, [clinicaId, doctorId, pacienteId, remitente]);

  // 2. Auto-scroll al final cuando llegan mensajes
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }
  , [mensajes]);

  // 3. 🌟 NUEVO: Guardar la fecha exacta del último mensaje leído
  useEffect(() => {
    if (mensajes.length > 0) {
      // Tomamos el último mensaje de la lista
      const ultimoMensaje = mensajes[mensajes.length - 1];
      
      // Extraemos su fecha (validamos por si viene en minúscula o mayúscula)
      const fechaParaGuardar = ultimoMensaje.fecha_Envio || ultimoMensaje.Fecha_Envio;
      
      if (fechaParaGuardar) {
        localStorage.setItem('ultimoAccesoChat', fechaParaGuardar);
      }
    } else if (!localStorage.getItem('ultimoAccesoChat')) {
      // Si el chat está vacío y es la primera vez, ponemos una fecha antigua base
      localStorage.setItem('ultimoAccesoChat', '2000-01-01T00:00:00');
    }
  }, [mensajes]);

  // 3. Enviar mensaje de texto normal
  const enviarMensaje = async (e) => {
    if (e) e.preventDefault();
    if (texto.trim() && connectionRef.current) {
      if (connectionRef.current.state !== HubConnectionState.Connected) {
        alert("La conexión con el chat no está lista todavía.");
        return;
      }
      try {
        await connectionRef.current.invoke("EnviarMensaje", Number(clinicaId), Number(doctorId), Number(pacienteId), remitente, texto);
        setTexto('');
      } catch (error) {
        console.error("Error al enviar mensaje:", error);
      }
    }
  };

  // 4. Enviar la receta por el chat
  const generarYEnviarReceta = async () => {
    if (!textoReceta.trim()) {
      alert("La receta no puede estar vacía.");
      return;
    }

    if (connectionRef.current && connectionRef.current.state === HubConnectionState.Connected) {
      const textoAEnviar = `[RECETA_PDF]${textoReceta}`;
      try {
        await connectionRef.current.invoke("EnviarMensaje", Number(clinicaId), Number(doctorId), Number(pacienteId), remitente, textoAEnviar);
        setTextoReceta('');
        setMostrarModalReceta(false);
      } catch (error) {
        console.error("Error al enviar receta:", error);
      }
    } else {
      alert("No hay conexión activa con el servidor.");
    }
  };

  // 5. Generar físicamente el PDF cuando se hace clic en el botón
  const descargarPDFReceta = (textoPrescripcion, fechaEnvio) => {
    const doc = new jsPDF();
    const datosExtra = obtenerDatosDelToken();
    
    // Encabezado
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text("RECETA MÉDICA", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de emisión: ${new Date(fechaEnvio).toLocaleDateString()}`, 20, 30);
    
    // Nombres Dinámicos
    doc.text(`Clínica: ${datosExtra.clinica}`, 20, 36);
    doc.text(`Médico Tratante: Dr(a). ${datosExtra.doctor}`, 20, 42);
    doc.text(`Paciente: ${nombreContraparte || 'Paciente'}`, 20, 48);

    doc.setDrawColor(200);
    doc.line(20, 52, 190, 52);

    // Contenido
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Indicaciones Médicas:", 20, 62);
    
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(textoPrescripcion, 170), 20, 72);

    // Firma
    doc.line(70, 140, 140, 140);
    doc.text(`Firma de Dr(a). ${datosExtra.doctor}`, 105, 146, { align: "center" });

    // Descarga
    doc.save(`Receta_${new Date(fechaEnvio).getTime()}.pdf`);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: '1px solid #ddd',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: remitente === 'Doctor' ? '#2c3e50' : '#27ae60',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong style={{ fontSize: '15px' }}>{nombreContraparte || `Chat con ${remitente === 'Doctor' ? 'Paciente' : 'Doctor'}`}</strong>
          <div style={{ fontSize: '11px', opacity: 0.85 }}>En línea</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        )}
      </div>

      {/* Mensajes */}
      <div ref={chatRef} style={{ flex: 1, padding: '12px', overflowY: 'auto', backgroundColor: '#e5ddd5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {mensajes.map((msg, idx) => {
          const esMio = msg.enviado_Por === remitente;
          
          const esReceta = msg.mensaje_Texto.startsWith('[RECETA_PDF]');
          const textoLimpio = esReceta ? msg.mensaje_Texto.replace('[RECETA_PDF]', '') : msg.mensaje_Texto;

          return (
            <div key={idx} style={{ alignSelf: esMio ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{
                backgroundColor: esMio ? '#dcf8c6' : '#ffffff',
                padding: '10px 14px',
                borderRadius: '7px',
                fontSize: '13px',
                boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                wordBreak: 'break-word'
              }}>
                
                {esReceta ? (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#2c3e50' }}>💊 Receta Electrónica</p>
                    <button 
                      onClick={() => descargarPDFReceta(textoLimpio, msg.fecha_Envio)}
                      style={{
                        padding: '8px 15px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      📄 Descargar PDF
                    </button>
                  </div>
                ) : (
                  <div>{textoLimpio}</div>
                )}

                <div style={{ fontSize: '9px', color: '#999', textAlign: 'right', marginTop: '6px' }}>
                  {new Date(msg.fecha_Envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de Acciones y Envío */}
      <div style={{ padding: '8px 10px', backgroundColor: '#f0f0f0', borderTop: '1px solid #ddd' }}>
        {remitente === 'Doctor' && (
          <button
            onClick={() => setMostrarModalReceta(true)}
            style={{
              width: '100%',
              marginBottom: '8px',
              padding: '6px',
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            📄 Redactar y Enviar Receta PDF
          </button>
        )}
        <form onSubmit={enviarMensaje} style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none' }}
          />
          <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>
            ➤
          </button>
        </form>
      </div>

      {/* MODAL DE REDACCIÓN DE RECETA */}
      {mostrarModalReceta && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '320px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <h4 style={{ margin: 0, color: '#2c3e50' }}>📄 Redactar Receta</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#7f8c8d' }}>
              Las indicaciones se enviarán al paciente y podrá descargarlas en formato PDF.
            </p>
            <textarea 
              rows="5"
              value={textoReceta}
              onChange={(e) => setTextoReceta(e.target.value)}
              placeholder="Ej. Paracetamol 500mg cada 8 horas..."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '5px' }}>
              <button 
                onClick={() => setMostrarModalReceta(false)}
                style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#95a5a6', color: 'white', fontSize: '12px' }}
              >
                Cancelar
              </button>
              <button 
                onClick={generarYEnviarReceta}
                style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#3498db', color: 'white', fontWeight: 'bold', fontSize: '12px' }}
              >
                Enviar al Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}