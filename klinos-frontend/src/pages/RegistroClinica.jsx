import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function RegistroClinica() {
  const [datos, setDatos] = useState({
    nombre_Clinica: "",
    email_Administrador: "",
    password: ""
  });
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      // Llamamos a nuestra nueva ruta pública en C#
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/Clinicas/Registro`, datos);
      
      alert(res.data.mensaje); // "¡Clínica registrada con éxito!"
      navigate("/login"); // Lo mandamos a iniciar sesión
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.mensaje || "Hubo un error al crear la cuenta.";
      alert(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      
      {/* PANEL IZQUIERDO: Beneficios */}
      <div style={{ flex: 1, backgroundColor: "#2980b9", color: "white", padding: "60px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h1 style={{ fontSize: "40px", marginBottom: "20px" }}>Tu clínica, <br/>lista para el futuro.</h1>
        <p style={{ fontSize: "18px", opacity: 0.9, lineHeight: "1.6", marginBottom: "40px" }}>
          Estás a un paso de centralizar tus citas, médicos y pacientes. Disfruta de 30 días con acceso total, sin compromisos.
        </p>
        
        <ul style={{ listStyle: "none", padding: 0, fontSize: "16px", lineHeight: "2.5" }}>
          <li>✅ Expedientes Clínicos Ilimitados</li>
          <li>✅ Módulo para Múltiples Doctores</li>
          <li>✅ Portal Exclusivo para Pacientes</li>
          <li>✅ Soporte Técnico Prioritario</li>
        </ul>
      </div>

      {/* PANEL DERECHO: Formulario de Registro */}
      <div style={{ flex: 1.2, backgroundColor: "#f4f7f6", padding: "60px", display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto" }}>
        
        <div style={{ width: "100%", maxWidth: "450px", backgroundColor: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h2 style={{ color: "#2c3e50", marginTop: 0 }}>Crear cuenta administrativa</h2>
          <p style={{ color: "#7f8c8d", marginBottom: "30px", fontSize: "14px" }}>Comienza tu prueba gratuita de 30 días hoy mismo.</p>

          <form onSubmit={handleRegistro} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* DATOS DE LA CLÍNICA */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#2c3e50" }}>Nombre de la Clínica / Consultorio</label>
              <input 
                type="text" required 
                placeholder="Ej. Centro Médico San José"
                value={datos.nombre_Clinica}
                onChange={(e) => setDatos({...datos, nombre_Clinica: e.target.value})}
                style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#2c3e50" }}>Correo del Administrador</label>
              <input 
                type="email" required 
                placeholder="director@clinica.com"
                value={datos.email_Administrador}
                onChange={(e) => setDatos({...datos, email_Administrador: e.target.value})}
                style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#2c3e50" }}>Contraseña Segura</label>
              <input 
                type="password" required 
                placeholder="Mínimo 6 caracteres"
                value={datos.password}
                onChange={(e) => setDatos({...datos, password: e.target.value})}
                style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd", boxSizing: "border-box" }}
              />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "10px 0" }} />

            {/* SIMULACIÓN DE MÉTODO DE PAGO */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#2c3e50" }}>Método de pago (No se harán cargos hoy)</label>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <input type="text" placeholder="Número de Tarjeta" style={{ flex: 2, padding: "12px", borderRadius: "6px", border: "1px solid #ddd" }} />
                <input type="text" placeholder="MM/AA" style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "1px solid #ddd" }} />
                <input type="text" placeholder="CVC" style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "1px solid #ddd" }} />
              </div>
              <small style={{ color: "#27ae60", display: "flex", alignItems: "center", gap: "5px" }}>
                🔒 <span>Conexión cifrada. Inicia tu prueba sin riesgo.</span>
              </small>
            </div>

            <button 
              type="submit" 
              disabled={cargando}
              style={{ padding: "15px", backgroundColor: "#2ecc71", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "16px", cursor: cargando ? "wait" : "pointer", marginTop: "10px", transition: "0.3s" }}
            >
              {cargando ? "Procesando..." : "Iniciar mis 30 días gratis"}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}