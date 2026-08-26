import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function LandingPage() {
  const navigate = useNavigate();

  // Pequeña animación al hacer scroll
  useEffect(() => {
    const elementos = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.style.opacity = 1;
      });
    });
    elementos.forEach(el => observer.observe(el));
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#2c3e50", margin: 0, padding: 0, overflowX: "hidden" }}>
      
      {/* NAVEGACIÓN */}
      <nav style={{ display: "flex", justifyContent: "space-between", padding: "20px 50px", alignItems: "center", backgroundColor: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 100 }}>
        <h2 style={{ margin: 0, color: "#2980b9", fontSize: "28px", fontWeight: "900", letterSpacing: "-1px" }}>
          KlinOS<span style={{ color: "#2ecc71" }}>.</span>
        </h2>
        <div style={{ display: "flex", gap: "15px" }}>
          <button onClick={() => navigate("/login")} style={{ padding: "10px 20px", backgroundColor: "transparent", border: "none", color: "#2c3e50", fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}>
            Iniciar Sesión
          </button>
          <button onClick={() => navigate("/registro-clinica")} style={{ padding: "10px 20px", backgroundColor: "#2980b9", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px", boxShadow: "0 4px 6px rgba(41, 128, 185, 0.3)", transition: "transform 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Probar Gratis
          </button>
        </div>
      </nav>

      {/* HERO SECTION (El gancho) */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "80px 50px", backgroundColor: "#f4f7f6", minHeight: "70vh" }}>
        <div style={{ maxWidth: "50%", zIndex: 2 }}>
          <div style={{ display: "inline-block", padding: "5px 15px", backgroundColor: "#e8f8f5", color: "#1abc9c", borderRadius: "20px", fontWeight: "bold", fontSize: "14px", marginBottom: "20px" }}>
            🚀 Lanza tu clínica al futuro
          </div>
          <h1 style={{ fontSize: "56px", margin: "0 0 20px 0", lineHeight: "1.1", fontWeight: "900", color: "#1a252f" }}>
            Gestión médica <br/><span style={{ color: "#2980b9" }}>inteligente y en la nube.</span>
          </h1>
          <p style={{ fontSize: "20px", color: "#7f8c8d", marginBottom: "40px", lineHeight: "1.6" }}>
            KlinOS centraliza expedientes, citas y a toda tu plantilla médica en una sola plataforma. Sin instalaciones complejas, accesible desde cualquier dispositivo.
          </p>
          <button onClick={() => navigate("/registro-clinica")} style={{ padding: "18px 35px", backgroundColor: "#2ecc71", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "18px", boxShadow: "0 4px 15px rgba(46, 204, 113, 0.4)", transition: "transform 0.2s" }}
             onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
             onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Comienza tu mes gratis ahora
          </button>
          <p style={{ marginTop: "15px", fontSize: "14px", color: "#95a5a6" }}>* No se requiere tarjeta de crédito para iniciar.</p>
        </div>
        
        {/* IMAGEN DEL HERO */}
        <div style={{ maxWidth: "45%", position: "relative" }}>
          <div style={{ position: "absolute", top: "-20px", left: "-20px", width: "100%", height: "100%", backgroundColor: "#3498db", borderRadius: "20px", zIndex: 1, opacity: 0.1 }}></div>
          <img 
            src="image_agent_tag_10718960515285612130" 
            alt="Doctor usando KlinOS en su tablet" 
            style={{ width: "100%", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", position: "relative", zIndex: 2 }}
          />
        </div>
      </header>

      {/* FEATURES (Por qué elegir KlinOS) */}
      <section style={{ padding: "80px 50px", backgroundColor: "white", textAlign: "center" }}>
        <h2 style={{ fontSize: "36px", marginBottom: "60px", color: "#2c3e50" }}>Todo lo que tu clínica necesita</h2>
        
        <div style={{ display: "flex", justifyContent: "space-between", gap: "30px" }}>
          {/* Card 1 */}
          <div className="fade-in" style={{ flex: 1, padding: "40px 20px", backgroundColor: "#f9f9f9", borderRadius: "15px", opacity: 0, transition: "opacity 1s ease-out" }}>
            <div style={{ fontSize: "50px", marginBottom: "20px" }}>🗂️</div>
            <h3 style={{ fontSize: "22px", marginBottom: "15px" }}>Expedientes Digitales</h3>
            <p style={{ color: "#7f8c8d", lineHeight: "1.5" }}>Historial clínico, recetas y diagnósticos encriptados y disponibles en un clic para todo tu personal autorizado.</p>
          </div>

          {/* Card 2 */}
          <div className="fade-in" style={{ flex: 1, padding: "40px 20px", backgroundColor: "#f9f9f9", borderRadius: "15px", opacity: 0, transition: "opacity 1s ease-out", transitionDelay: "0.2s" }}>
            <div style={{ fontSize: "50px", marginBottom: "20px" }}>👨‍⚕️</div>
            <h3 style={{ fontSize: "22px", marginBottom: "15px" }}>Multi-Doctor</h3>
            <p style={{ color: "#7f8c8d", lineHeight: "1.5" }}>Agrega a toda tu plantilla médica. Cada doctor tiene su propio acceso, agenda y control de sus pacientes asignados.</p>
          </div>

          {/* Card 3 */}
          <div className="fade-in" style={{ flex: 1, padding: "40px 20px", backgroundColor: "#f9f9f9", borderRadius: "15px", opacity: 0, transition: "opacity 1s ease-out", transitionDelay: "0.4s" }}>
            <div style={{ fontSize: "50px", marginBottom: "20px" }}>📱</div>
            <h3 style={{ fontSize: "22px", marginBottom: "15px" }}>Portal del Paciente</h3>
            <p style={{ color: "#7f8c8d", lineHeight: "1.5" }}>Tus pacientes pueden iniciar sesión para ver sus próximas citas, descargar recetas y leer los comunicados de tu clínica.</p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION FINAL */}
      <section style={{ padding: "80px 50px", backgroundColor: "#2980b9", color: "white", textAlign: "center" }}>
        <h2 style={{ fontSize: "40px", margin: "0 0 20px 0" }}>¿Listo para modernizar tus consultas?</h2>
        <p style={{ fontSize: "20px", marginBottom: "40px", opacity: 0.9 }}>Únete a las clínicas que ya optimizan su tiempo con KlinOS.</p>
        <button onClick={() => navigate("/registro-clinica")} style={{ padding: "18px 40px", backgroundColor: "white", color: "#2980b9", border: "none", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "20px", boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}>
          Crear mi cuenta clínica (30 días gratis)
        </button>
      </section>

    </div>
  );
}