import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ClinicaContext } from "../ClinicaContext";

export default function PanelClinica() {
  const { datosGlobales, cargarDatosGlobales } = useContext(ClinicaContext);
  // ==========================================
  // 1. ESTADOS
  // ==========================================
  const [vistaActiva, setVistaActiva] = useState("doctores");
  const [doctores, setDoctores] = useState([]);
  
  // Estados para el Modal de Nuevo Doctor
  const [mostrarModalDoctor, setMostrarModalDoctor] = useState(false);
const [datosClinica, setDatosClinica] = useState({ 
    nombre_Clinica: "", 
    telefono_Contacto: "", 
    subdominio_URL: "",
    ruta_Local_Logo: "",
    numero_Licencia: "",
    fecha_Fin_Suscripcion: null, 
    metodo_Pago: "",
    suscripcion_Cancelada: false 

  });
  const [archivoLogo, setArchivoLogo] = useState(null);

  const navigate = useNavigate();

  // ==========================================
  // 2. DATOS DE LA CLÍNICA LOGUEADA
  // ==========================================
const obtenerDatosClinica = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return { clinicaId: null };

      // Abrimos el token
      const payload = JSON.parse(atob(token.split(".")[1]));
      
      // 🕵️‍♂️ Imprimimos el token en la consola para ver cómo C# mandó los datos
      console.log("Token abierto en PanelClinica:", payload);
      
      // Buscamos el ID. C# a veces cambia las mayúsculas al generar el JWT, 
      // así que cubrimos todas las opciones posibles (priorizando clinicaId):
      const idDetectado = payload.clinicaId || payload.ClinicaId || payload.clinica_ID || payload.nameid || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      
      console.log("ID de la clínica detectado:", idDetectado);

      return { clinicaId: parseInt(idDetectado) };
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return { clinicaId: null };
    }
  };

  const infoClinica = obtenerDatosClinica();

  // ==========================================
  // 3. EFECTOS Y PETICIONES API
  // ==========================================
  useEffect(() => {
    cargarDoctores();
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/Clinicas/${infoClinica.clinicaId}`);
      setDatosClinica({
        nombre_Clinica: res.data.nombre_Clinica || res.data.Nombre_Clinica || "",
        telefono_Contacto: res.data.telefono_Contacto || res.data.Telefono_Contacto || "",
        subdominio_URL: res.data.subdominio_URL || res.data.Subdominio_URL || "",
        ruta_Local_Logo: res.data.ruta_Local_Logo || res.data.Ruta_Local_Logo || "",
        numero_Licencia: res.data.numero_Licencia || res.data.Numero_Licencia || "",
        fecha_Fin_Suscripcion: res.data.fecha_Fin_Suscripcion || res.data.Fecha_Fin_Suscripcion || null,
        metodo_Pago: res.data.metodo_Pago || res.data.Metodo_Pago || "",
        suscripcion_Cancelada: res.data.suscripcion_Cancelada || res.data.Suscripcion_Cancelada || false
      });
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    }
  };

  const handleGuardarConfiguracion = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("nombre_Clinica", datosClinica.nombre_Clinica);
      formData.append("telefono_Contacto", datosClinica.telefono_Contacto);
      formData.append("subdominio_URL", datosClinica.subdominio_URL);
      
      if (archivoLogo) {
        formData.append("logo", archivoLogo);
      }

      await axios.put(`${import.meta.env.VITE_API_URL}/api/Clinicas/${infoClinica.clinicaId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("¡Configuración actualizada con éxito!");
      setArchivoLogo(null);
      cargarConfiguracion(); // Recargamos para ver la nueva imagen y datos
      cargarDatosGlobales();
    } catch (error) {
      console.error("Error al guardar:", error);
      const msg = error.response?.data?.mensaje || "Hubo un error al actualizar.";
      alert(msg);
    }
  };

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

  const handleCancelarSuscripcion = async () => {
    const confirmar = window.confirm("¿Estás seguro de que deseas cancelar tu suscripción? Perderás el acceso a la plataforma al terminar tu periodo.");
    if (!confirmar) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/Clinicas/${infoClinica.clinicaId}/cancelar-suscripcion`);
      alert("Suscripción cancelada.");
      // Opcional: Cerrar sesión inmediatamente o recargar datos
      cargarConfiguracion(); 
    } catch (error) {
      alert("Hubo un error al cancelar la suscripción.");
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
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          {datosGlobales.ruta_Local_Logo ? (
            <img 
              src={`${import.meta.env.VITE_API_URL}${datosGlobales.ruta_Local_Logo}`} 
              alt="Logo" 
              style={{ width: "100%", maxHeight: "80px", objectFit: "contain", backgroundColor: "white", padding: "5px", borderRadius: "8px" }}
            />
          ) : (
            <h1 style={{ margin: 0, fontSize: "40px" }}>🏢</h1>
          )}
          <h3 style={{ marginTop: "10px", wordWrap: "break-word" }}>{datosGlobales.nombre_Clinica}</h3>
        </div>
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

          <li 
            onClick={() => setVistaActiva("suscripcion")}
            style={{ padding: "12px", borderBottom: "1px solid #34495e", cursor: "pointer", backgroundColor: vistaActiva === "suscripcion" ? "#34495e" : "transparent" }}
          >
            💳 Plan y Suscripción
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
          <div style={{ maxWidth: "600px", backgroundColor: "white", padding: "30px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginTop: 0, color: "#2c3e50" }}>Configuración de la Clínica</h2>
            
            <form onSubmit={handleGuardarConfiguracion} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
              
              {/* Previsualización del Logo Actual */}
              {datosClinica.ruta_Local_Logo && (
                <div style={{ textAlign: "center", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #eee" }}>
                  <img 
                    src={`${import.meta.env.VITE_API_URL}${datosClinica.ruta_Local_Logo}`} 
                    alt="Logo Clínica" 
                    style={{ maxHeight: "100px", objectFit: "contain" }}
                  />
                  <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#7f8c8d" }}>Logotipo Actual</p>
                </div>
              )}

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#2c3e50" }}>Nombre de la Clínica:</label>
                <input
                  type="text"
                  required
                  value={datosClinica.nombre_Clinica}
                  onChange={(e) => setDatosClinica({ ...datosClinica, nombre_Clinica: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#2c3e50" }}>Subdominio URL:</label>
                <input
                  type="text"
                  value={datosClinica.subdominio_URL}
                  placeholder="ej. miclinica"
                  onChange={(e) => setDatosClinica({ ...datosClinica, subdominio_URL: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#2c3e50" }}>Teléfono de Contacto:</label>
                <input
                  type="text"
                  value={datosClinica.telefono_Contacto}
                  onChange={(e) => setDatosClinica({ ...datosClinica, telefono_Contacto: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#2c3e50" }}>Actualizar Logotipo (Opcional):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArchivoLogo(e.target.files[0])}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px dashed #3498db", backgroundColor: "#f0f8ff", cursor: "pointer" }}
                />
                {archivoLogo && (
                  <small style={{ color: "#27ae60", display: "block", marginTop: "5px" }}>
                    ✓ Imagen seleccionada: {archivoLogo.name}
                  </small>
                )}
              </div>

              <button
                type="submit"
                style={{ padding: "12px", backgroundColor: "#2ecc71", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer", fontSize: "16px", marginTop: "10px" }}
              >
                💾 Guardar Cambios
              </button>
            </form>
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

      {/* ========================================= */}
      {/* MODAL Cancelar Suscripción                */}
      {/* ========================================= */}
      {vistaActiva === "suscripcion" && (
          <div style={{ maxWidth: "600px", backgroundColor: "white", padding: "30px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginTop: 0, color: "#2c3e50" }}>Detalles de Suscripción</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
              <div style={{ padding: "15px", backgroundColor: "#f8f9f9", borderRadius: "6px", borderLeft: "4px solid #3498db" }}>
                <p style={{ margin: "0 0 5px 0", color: "#7f8c8d", fontSize: "14px" }}>Número de Licencia KlinOS</p>
                <p style={{ margin: 0, fontWeight: "bold", fontSize: "18px", letterSpacing: "2px" }}>{datosClinica.numero_Licencia || "NO ASIGNADA"}</p>
              </div>

              <div style={{ padding: "15px", backgroundColor: "#f8f9f9", borderRadius: "6px", borderLeft: "4px solid #2ecc71" }}>
                <p style={{ margin: "0 0 5px 0", color: "#7f8c8d", fontSize: "14px" }}>Estado del Plan</p>
                {datosClinica.suscripcion_Cancelada ? (
                  <p style={{ margin: 0, fontWeight: "bold", color: "#e74c3c" }}>Cancelada (Pendiente de corte)</p>
                ) : (
                  <p style={{ margin: 0, fontWeight: "bold", color: "#27ae60" }}>Activa - Plan Profesional</p>
                )}
              </div>

              <div style={{ padding: "15px", backgroundColor: "#f8f9f9", borderRadius: "6px", borderLeft: "4px solid #f1c40f" }}>
                <p style={{ margin: "0 0 5px 0", color: "#7f8c8d", fontSize: "14px" }}>Vencimiento del periodo</p>
                <p style={{ margin: 0, fontWeight: "bold" }}>
                  {datosClinica.fecha_Fin_Suscripcion 
                    ? new Date(datosClinica.fecha_Fin_Suscripcion).toLocaleDateString("es-MX", { year: 'numeric', month: 'long', day: 'numeric' })
                    : "Cargando fecha..."}
                </p>
              </div>

              <div style={{ padding: "15px", backgroundColor: "#f8f9f9", borderRadius: "6px", borderLeft: "4px solid #9b59b6" }}>
                <p style={{ margin: "0 0 5px 0", color: "#7f8c8d", fontSize: "14px" }}>Método de Pago Actual</p>
                <p style={{ margin: 0, fontWeight: "bold" }}>{datosClinica.metodo_Pago || "Prueba Gratuita"}</p>
              </div>
            </div>

            {!datosClinica.suscripcion_Cancelada && (
              <div style={{ marginTop: "40px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
                <h3 style={{ fontSize: "16px", color: "#c0392b" }}>Zona de Peligro</h3>
                <p style={{ fontSize: "14px", color: "#7f8c8d" }}>Al cancelar, tus doctores y pacientes ya no podrán acceder al sistema al terminar el mes.</p>
                <button 
                  onClick={handleCancelarSuscripcion}
                  style={{ padding: "10px 15px", backgroundColor: "white", color: "#c0392b", border: "1px solid #c0392b", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
                >
                  Cancelar mi suscripción
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
}