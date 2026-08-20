import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ChatVentana from "../components/chat/ChatVentana";
import ChatFlotante from '../components/chat/ChatFlotante';

export default function PanelPaciente() {
  const [vistaActiva, setVistaActiva] = useState("muro");
  const [publicaciones, setPublicaciones] = useState([]);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const navigate = useNavigate();

  // Extraer datos del Paciente desde su Token (JWT)
  const obtenerDatosPaciente = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { pacienteId: 0, clinicaId: 1, nombre: 'Paciente' };
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const idStr = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || payload.nameid || payload.sub;
      
      return {
        pacienteId: parseInt(idStr) || 0,
        clinicaId: payload.clinicaId ? parseInt(payload.clinicaId) : 1,
        nombre: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || payload.name || 'Paciente'
      };
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return { pacienteId: 0, clinicaId: 1, nombre: 'Paciente' };
    }
  };

  const infoPaciente = obtenerDatosPaciente();

  // Cargar datos al iniciar
  useEffect(() => {
    // 1. Cargar Publicaciones del Muro
    axios.get(`${import.meta.env.VITE_API_URL}/api/Publicaciones`)
      .then(res => setPublicaciones(res.data))
      .catch(err => console.error("Error al cargar publicaciones:", err));

    // 2. Cargar Citas del Paciente
    if (infoPaciente.pacienteId > 0) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/Citas/MisCitasPaciente`)
        .then(res => setCitas(res.data))
        .catch(err => console.error("Error al cargar citas:", err))
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, [infoPaciente.pacienteId]);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const obtenerColorEtiqueta = (tipo) => {
    switch (tipo) {
      case "Recomendación": return "#27ae60";
      case "Anuncio": return "#3498db";
      case "Aviso": return "#e67e22";
      default: return "#95a5a6";
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif", margin: 0 }}>
      
      {/* --- BARRA LATERAL DEL PACIENTE --- */}
      <div style={{ width: "250px", backgroundColor: "#2c3e50", color: "white", padding: "20px", display: "flex", flexDirection: "column" }}>
        <h2>KlinOS <span style={{ fontSize: "14px", color: "#3498db" }}>Pacientes</span></h2>
        
        <ul style={{ listStyle: "none", padding: 0, marginTop: "30px", flexGrow: 1 }}>
          <li
            onClick={() => setVistaActiva("muro")}
            style={{ padding: "10px 0", borderBottom: "1px solid #34495e", cursor: "pointer", color: vistaActiva === "muro" ? "white" : "#95a5a6" }}
          >
            📰 Muro de Salud
          </li>
          <li
            onClick={() => setVistaActiva("citas")}
            style={{ padding: "10px 0", borderBottom: "1px solid #34495e", cursor: "pointer", color: vistaActiva === "citas" ? "white" : "#95a5a6" }}
          >
            📅 Mis Citas
          </li>
          <li
            onClick={() => setVistaActiva("chat")}
            style={{ padding: "10px 0", borderBottom: "1px solid #34495e", cursor: "pointer", color: vistaActiva === "chat" ? "white" : "#95a5a6" }}
          >
            💬 Mis Mensajes y Recetas
          </li>
        </ul>

        <div onClick={cerrarSesion} style={{ padding: "15px 0", borderTop: "1px solid #34495e", cursor: "pointer", color: "#e74c3c", fontWeight: "bold", marginTop: "auto" }}>
          🚪 Cerrar Sesión
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div style={{ flex: 1, padding: "40px", backgroundColor: "#f4f6f9", position: "relative" }}>
        
        {/* VISTA: MURO DE SALUD */}
        {vistaActiva === "muro" && (
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ marginBottom: "30px", textAlign: "center" }}>
              <h2 style={{ color: "#2c3e50", fontSize: "28px", margin: "0 0 10px 0" }}>📰 Muro de Salud y Comunicados</h2>
              <p style={{ color: "#7f8c8d", margin: 0 }}>Bienvenido, {infoPaciente.nombre}. Mantente al día con los avisos de tu clínica.</p>
            </div>

            {cargando ? (
              <div style={{ textAlign: "center", color: "#7f8c8d", marginTop: "50px" }}>Cargando información...</div>
            ) : publicaciones.length === 0 ? (
              <div style={{ textAlign: "center", color: "#95a5a6", marginTop: "50px" }}>No hay publicaciones recientes en el muro.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                {publicaciones.map((post) => (
                  <div key={post.id} style={{ backgroundColor: "white", borderRadius: "10px", padding: "25px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "1px solid #eaeaea" }}>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #f0f0f0", paddingBottom: "15px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "45px", height: "45px", borderRadius: "50%", backgroundColor: "#34495e", color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px", fontWeight: "bold" }}>
                          {post.doctorNombre ? post.doctorNombre.charAt(0) : "Dr"}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, color: "#2c3e50", fontSize: "16px" }}>{post.doctorNombre}</h4>
                          <span style={{ fontSize: "13px", color: "#95a5a6" }}>
                            {new Date(post.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      <span style={{ backgroundColor: obtenerColorEtiqueta(post.tipo), color: "white", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                        {post.tipo}
                      </span>
                    </div>

                    <div>
                      <h3 style={{ margin: "0 0 10px 0", color: "#2c3e50", fontSize: "20px" }}>{post.titulo}</h3>
                      <p style={{ margin: 0, color: "#555", lineHeight: "1.6", fontSize: "15px", whiteSpace: "pre-wrap" }}>{post.contenido}</p>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VISTA: MIS CITAS */}
        {vistaActiva === "citas" && (
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ marginBottom: "30px", textAlign: "center" }}>
              <h2 style={{ color: "#2c3e50", fontSize: "28px", margin: "0 0 10px 0" }}>📅 Mis Citas Médicas</h2>
              <p style={{ color: "#7f8c8d", margin: 0 }}>Consulta tus citas pendientes con el especialista.</p>
            </div>

            {cargando ? (
              <div style={{ textAlign: "center", color: "#7f8c8d", marginTop: "50px" }}>Cargando citas...</div>
            ) : citas.length === 0 ? (
              <div style={{ textAlign: "center", backgroundColor: "white", padding: "40px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", color: "#95a5a6" }}>
                No tienes citas programadas actualmente.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {citas.map((cita) => (
                  <div key={cita.id || cita.Id} style={{ backgroundColor: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: "5px solid #3498db", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: "0 0 5px 0", color: "#2c3e50", fontSize: "18px" }}>
                        Dr(a). {cita.doctorNombre || cita.DoctorNombre || "Especialista"}
                      </h4>
                      <p style={{ margin: "0 0 5px 0", color: "#555", fontSize: "14px" }}>
                        <strong>Motivo:</strong> {cita.motivo || cita.Motivo || "Consulta general"}
                      </p>
                      <span style={{ fontSize: "13px", color: "#7f8c8d" }}>
                        🗓️ {new Date(cita.fechaHora || cita.Fecha_Hora).toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div>
                      <span style={{ backgroundColor: "#e8f8f5", color: "#1abc9c", padding: "6px 12px", borderRadius: "15px", fontSize: "12px", fontWeight: "bold" }}>
                        {cita.estado || cita.Estado || "Confirmada"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VISTA: CHAT CON EL DOCTOR */}
        {vistaActiva === "chat" && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <h2 style={{ marginBottom: "20px", color: "#2c3e50" }}>Chat Médico y Recetas Electrónicas</h2>
            
            {/* Validamos si el paciente tiene al menos una cita para saber con qué doctor chatear */}
            {citas.length > 0 ? (
              <div style={{ flex: 1, minHeight: "500px" }}>
                <ChatVentana 
                  clinicaId={infoPaciente.clinicaId}
                  doctorId={citas[0].doctorId || citas[0].doctor_ID || 2} 
                  pacienteId={infoPaciente.pacienteId}
                  remitente="Paciente"
                  nombreContraparte={citas[0].doctorNombre || "Especialista"} 
                />
              </div>
            ) : (
              <div style={{ padding: "20px", backgroundColor: "white", borderRadius: "8px", textAlign: "center", color: "#7f8c8d" }}>
                <p>Aún no tienes citas médicas registradas.</p>
                <p>Necesitas tener al menos una cita agendada para poder chatear con tu médico tratante.</p>
              </div>
            )}
          </div>
        )}

      </div>
      {/* CHAT FLOTANTE: Aparecerá en todas las pantallas del paciente */}
      {citas.length > 0 && vistaActiva != "chat" && (
        <ChatFlotante 
          clinicaId={infoPaciente.clinicaId}
          doctorId={citas[0].doctorId || citas[0].doctor_ID} 
          pacienteId={infoPaciente.pacienteId}
          nombreDoctor={citas[0].doctorNombre || "Médico Tratante"} 
        />
      )}
    </div>
  );
}