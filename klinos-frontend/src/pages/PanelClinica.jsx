import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function PanelClinica() {
  // ==========================================
  // 1. ESTADOS
  // ==========================================
  const [vistaActiva, setVistaActiva] = useState("doctores");
  const [doctores, setDoctores] = useState([]);
  
  // Estados para el Modal de Nuevo Doctor
  const [mostrarModalDoctor, setMostrarModalDoctor] = useState(false);
  const [datosNuevoDoctor, setDatosNuevoDoctor] = useState({
    nombre_Completo: "",
    especialidad: "",
    email: "",
    password_Hash: "",
  });

  const navigate = useNavigate();

  // ==========================================
  // 2. DATOS DE LA CLÍNICA LOGUEADA
  // ==========================================
  const obtenerDatosClinica = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return { clinicaId: 1 }; // 1 por defecto para pruebas

      const payload = JSON.parse(atob(token.split(".")[1]));
      // Si el login es de clínica, leemos su ID
      const idClinica = payload.clinicaId || payload.Clinica_ID || 1;
      return { clinicaId: parseInt(idStr) };
    } catch (error) {
      return { clinicaId: 1 };
    }
  };

  const infoClinica = obtenerDatosClinica();

  // ==========================================
  // 3. EFECTOS Y PETICIONES API
  // ==========================================
  useEffect(() => {
    cargarDoctores();
  }, []);

  const cargarDoctores = async () => {
    try {
      console.log("Buscando doctores para la clínica con ID:", infoClinica.clinicaId);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Doctores/Clinica/${infoClinica.clinicaId}`
      );
      console.log("Doctores devueltos por C#:", res.data);
      setDoctores(res.data);
    } catch (error) {
      console.error("Error al cargar doctores:", error);
      
    }
  };

  const handleRegistrarDoctor = async (e) => {
    e.preventDefault();
    try {
      // Usamos el endpoint que auditamos y optimizamos
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/Doctores`, {
        nombre_Completo: datosNuevoDoctor.nombre_Completo,
        especialidad: datosNuevoDoctor.especialidad,
        email: datosNuevoDoctor.email,
        password_Hash: datosNuevoDoctor.password_Hash,
        clinica_ID: infoClinica.clinicaId // Forzamos la clínica actual
      });

      alert("¡Doctor registrado exitosamente!");
      setMostrarModalDoctor(false);
      setDatosNuevoDoctor({ nombre_Completo: "", especialidad: "", email: "", password_Hash: "" });
      cargarDoctores(); // Recargamos la tabla
    } catch (error) {
      console.error("Error al registrar doctor:", error);
      // Leemos el mensaje estructurado que configuramos en el backend
      const msg = error.response?.data?.mensaje || "Hubo un error al registrar al doctor.";
      alert(msg);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ==========================================
  // 4. RENDERIZADO VISUAL
  // ==========================================
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif", margin: 0 }}>
      {/* --- BARRA LATERAL --- */}
      <div style={{ width: "250px", backgroundColor: "#2980b9", color: "white", padding: "20px", display: "flex", flexDirection: "column" }}>
        <h2>🏢 Mi Clínica</h2>
        <ul style={{ listStyle: "none", padding: 0, marginTop: "30px", flexGrow: 1 }}>
          <li
            onClick={() => setVistaActiva("doctores")}
            style={{
              padding: "10px 0", borderBottom: "1px solid #3498db", cursor: "pointer",
              color: vistaActiva === "doctores" ? "white" : "#bdc3c7", fontWeight: vistaActiva === "doctores" ? "bold" : "normal"
            }}
          >
            👨‍⚕️ Plantilla Médica
          </li>
          <li
            onClick={() => setVistaActiva("configuracion")}
            style={{
              padding: "10px 0", borderBottom: "1px solid #3498db", cursor: "pointer",
              color: vistaActiva === "configuracion" ? "white" : "#bdc3c7", fontWeight: vistaActiva === "configuracion" ? "bold" : "normal"
            }}
          >
            ⚙️ Configuración
          </li>
        </ul>
        <div onClick={cerrarSesion} style={{ padding: "15px 0", borderTop: "1px solid #3498db", cursor: "pointer", color: "#ecf0f1", fontWeight: "bold", marginTop: "auto" }}>
          🚪 Cerrar Sesión
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div style={{ flex: 1, padding: "40px", backgroundColor: "#f4f6f9", position: "relative" }}>
        
        {vistaActiva === "doctores" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2>Doctores Registrados</h2>
              <button
                onClick={() => setMostrarModalDoctor(true)}
                style={{ padding: "10px 15px", backgroundColor: "#2ecc71", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                + Alta de Doctor
              </button>
            </div>

            {/* TABLA DE DOCTORES */}
            <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#ecf0f1", color: "#2c3e50", textAlign: "left" }}>
                    <th style={{ padding: "15px" }}>ID</th>
                    <th style={{ padding: "15px" }}>Nombre Completo</th>
                    <th style={{ padding: "15px" }}>Especialidad</th>
                    <th style={{ padding: "15px" }}>Email de Acceso</th>
                  </tr>
                </thead>
                <tbody>
                  {doctores.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "15px", fontWeight: "bold", color: "#7f8c8d" }}>#{doc.id}</td>
                      <td style={{ padding: "15px" }}>{doc.nombre_Completo}</td>
                      <td style={{ padding: "15px" }}>
                        <span style={{ backgroundColor: "#e8f4f8", color: "#2980b9", padding: "4px 8px", borderRadius: "12px", fontSize: "13px", fontWeight: "bold" }}>
                          {doc.especialidad}
                        </span>
                      </td>
                      <td style={{ padding: "15px" }}>{doc.email}</td>
                    </tr>
                  ))}
                  {doctores.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#95a5a6" }}>
                        No hay doctores registrados en esta clínica.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {vistaActiva === "configuracion" && (
          <div>
            <h2>Configuración de la Clínica</h2>
            <p style={{ color: "#7f8c8d" }}>Próximamente: Editar nombre, dirección y logotipo de la clínica.</p>
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* MODAL REGISTRAR NUEVO DOCTOR              */}
      {/* ========================================= */}
      {mostrarModalDoctor && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "8px", width: "400px", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, color: "#2c3e50" }}>Dar de Alta Doctor</h3>

            <form onSubmit={handleRegistrarDoctor} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nombre Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Dr. Juan Pérez"
                  value={datosNuevoDoctor.nombre_Completo}
                  onChange={(e) => setDatosNuevoDoctor({ ...datosNuevoDoctor, nombre_Completo: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Especialidad:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pediatría, Cardiología..."
                  value={datosNuevoDoctor.especialidad}
                  onChange={(e) => setDatosNuevoDoctor({ ...datosNuevoDoctor, especialidad: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Correo de Acceso (Email):</label>
                <input
                  type="email"
                  required
                  placeholder="doctor@clinica.com"
                  value={datosNuevoDoctor.email}
                  onChange={(e) => setDatosNuevoDoctor({ ...datosNuevoDoctor, email: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Contraseña Temporal:</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 caracteres..."
                  value={datosNuevoDoctor.password_Hash}
                  onChange={(e) => setDatosNuevoDoctor({ ...datosNuevoDoctor, password_Hash: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
                <small style={{ color: "#7f8c8d" }}>Esta contraseña se encriptará automáticamente en la Base de Datos.</small>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setMostrarModalDoctor(false)}
                  style={{ padding: "8px 15px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 15px", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Registrar Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}