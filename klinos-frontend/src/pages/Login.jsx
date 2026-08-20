import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [modo, setModo] = useState("login"); // "login", "registro", "verificar", "forgot-email", "forgot-reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [codigoIngresado, setCodigoIngresado] = useState("");
  
  const [clinicas, setClinicas] = useState([]);
  const [clinicaSeleccionada, setClinicaSeleccionada] = useState(1);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    if (modo === "registro") {
      axios.get(`${import.meta.env.VITE_API_URL}/api/Auth/clinicas`)
        .then(res => {
          setClinicas(res.data);
          if (res.data.length > 0) setClinicaSeleccionada(res.data[0].id);
        })
        .catch(err => console.error("Error al cargar clínicas:", err));
    }
  }, [modo]);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    if (modo === "registro") {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/Auth/register-paciente`, {
          nombre_Completo: nombre,
          email: email,
          password: password,
          telefono: telefono,
          clinica_ID: Number(clinicaSeleccionada)
        });

        setExito("¡Código enviado! Revisa tu bandeja de entrada.");
        setModo("verificar");
      } catch (err) {
        setError(err.response?.data || "Error al registrarse.");
      }
    } else if (modo === "verificar") {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/Auth/verificar-codigo`, {
          email: email,
          codigo: codigoIngresado
        });

        setExito("¡Cuenta verificada con éxito! Ya puedes iniciar sesión.");
        setModo("login");
        setPassword("");
        setCodigoIngresado("");
      } catch (err) {
        setError(err.response?.data || "Código inválido o expirado.");
      }
    } else if (modo === "forgot-email") {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/Auth/forgot-password`, {
          email: email
        });
        setExito("Código de recuperación enviado. Revisa tu correo.");
        setModo("forgot-reset");
      } catch (err) {
        setError(err.response?.data || "No se pudo enviar el correo.");
      }
    } else if (modo === "forgot-reset") {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/Auth/reset-password`, {
          email: email,
          codigo: codigoIngresado,
          nuevoPassword: nuevoPassword
        });
        setExito("¡Contraseña actualizada con éxito! Inicia sesión.");
        setModo("login");
        setPassword("");
        setNuevoPassword("");
        setCodigoIngresado("");
      } catch (err) {
        setError(err.response?.data || "Error al restablecer la contraseña.");
      }
    } else {
      // Login normal
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/Auth/login`, {
          email,
          password
        });

        const token = res.data.token;
        localStorage.setItem("token", token);
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        if (payload.role === "Doctor" || window.location.pathname.includes("doctor")) {
          navigate("/panel-doctor");
        } else {
          navigate("/panel-paciente");
        }
      } catch (err) {
        setError(err.response?.data || "Correo o contraseña incorrectos.");
      }
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f6f9", fontFamily: "sans-serif" }}>
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" }}>
        
        <h2 style={{ textAlign: "center", color: "#2c3e50", marginBottom: "10px" }}>
          {modo === "registro" && "Crear Cuenta"}
          {modo === "verificar" && "Verificar Correo"}
          {modo === "forgot-email" && "Recuperar Contraseña"}
          {modo === "forgot-reset" && "Nueva Contraseña"}
          {modo === "login" && "Iniciar Sesión en KlinOS"}
        </h2>
        <p style={{ textAlign: "center", color: "#7f8c8d", fontSize: "14px", marginBottom: "25px" }}>
          {modo === "registro" && "Selecciona tu clínica y regístrate."}
          {modo === "verificar" && `Ingresa el código enviado a ${email}`}
          {modo === "forgot-email" && "Ingresa tu correo para enviarte un código."}
          {modo === "forgot-reset" && "Ingresa el código y tu nueva contraseña."}
          {modo === "login" && "Bienvenido de vuelta."}
        </p>

        {error && <div style={{ backgroundColor: "#fadbd8", color: "#c0392b", padding: "10px", borderRadius: "5px", marginBottom: "15px", fontSize: "14px", textAlign: "center" }}>{error}</div>}
        {exito && <div style={{ backgroundColor: "#d4efdf", color: "#27ae60", padding: "10px", borderRadius: "5px", marginBottom: "15px", fontSize: "14px", textAlign: "center" }}>{exito}</div>}

        <form onSubmit={manejarEnvio} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          {modo === "registro" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#2c3e50", marginBottom: "5px" }}>Nombre Completo:</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#2c3e50", marginBottom: "5px" }}>Teléfono:</label>
                <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Opcional" style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#2c3e50", marginBottom: "5px" }}>Selecciona tu Clínica:</label>
                <select value={clinicaSeleccionada} onChange={(e) => setClinicaSeleccionada(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", backgroundColor: "white", boxSizing: "border-box" }}>
                  {clinicas.map((clinica) => (
                    <option key={clinica.id} value={clinica.id}>{clinica.nombre}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {modo === "verificar" && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#2c3e50", marginBottom: "5px" }}>Código de 6 dígitos:</label>
              <input type="text" maxLength="6" value={codigoIngresado} onChange={(e) => setCodigoIngresado(e.target.value)} placeholder="Ej. 482910" required style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", textAlign: "center", fontSize: "18px", letterSpacing: "4px", boxSizing: "border-box" }} />
            </div>
          )}

          {modo === "forgot-email" && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#2c3e50", marginBottom: "5px" }}>Correo Electrónico:</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }} />
            </div>
          )}

          {modo === "forgot-reset" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#2c3e50", marginBottom: "5px" }}>Código recibido:</label>
                <input type="text" maxLength="6" value={codigoIngresado} onChange={(e) => setCodigoIngresado(e.target.value)} placeholder="Ej. 482910" required style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", textAlign: "center", fontSize: "18px", letterSpacing: "4px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#2c3e50", marginBottom: "5px" }}>Nueva Contraseña:</label>
                <input type="password" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
            </>
          )}

          {modo === "login" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#2c3e50", marginBottom: "5px" }}>Correo Electrónico:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#2c3e50", marginBottom: "5px" }}>Contraseña:</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
            </>
          )}

          <button type="submit" style={{ padding: "12px", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer", fontSize: "15px", marginTop: "10px" }}>
            {modo === "registro" && "Enviar Código"}
            {modo === "verificar" && "Confirmar Cuenta"}
            {modo === "forgot-email" && "Enviar Código de Recuperación"}
            {modo === "forgot-reset" && "Cambiar Contraseña"}
            {modo === "login" && "Entrar"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {modo !== "login" ? (
            <button onClick={() => { setModo("login"); setError(""); setExito(""); }} style={{ background: "none", border: "none", color: "#2980b9", cursor: "pointer", fontSize: "14px", textDecoration: "underline" }}>
              Volver al Inicio de Sesión
            </button>
          ) : (
            <>
              <button onClick={() => { setModo("registro"); setError(""); setExito(""); }} style={{ background: "none", border: "none", color: "#2980b9", cursor: "pointer", fontSize: "14px", textDecoration: "underline" }}>
                ¿Eres paciente nuevo? Regístrate aquí
              </button>
              <button onClick={() => { setModo("forgot-email"); setError(""); setExito(""); }} style={{ background: "none", border: "none", color: "#e67e22", cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}>
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}