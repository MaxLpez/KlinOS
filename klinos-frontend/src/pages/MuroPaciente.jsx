import { useState, useEffect } from "react";
import axios from "axios";

export default function MuroPaciente() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Simulamos la carga de datos (Aquí luego pondrás tu axios.get a C#)
    useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/Publicaciones`)
      .then(res => {
        setPublicaciones(res.data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error al cargar publicaciones:", err);
        setCargando(false);
      });
  }, []);

  // Función para dar color a la etiqueta según el tipo de post
  const obtenerColorEtiqueta = (tipo) => {
    switch (tipo) {
      case "Recomendación":
        return "#27ae60"; // Verde
      case "Anuncio":
        return "#3498db"; // Azul
      case "Aviso":
        return "#e67e22"; // Naranja
      default:
        return "#95a5a6"; // Gris
    }
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Encabezado del Muro */}
      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        <h2
          style={{ color: "#2c3e50", fontSize: "28px", margin: "0 0 10px 0" }}
        >
          📰 Muro de Salud
        </h2>
        <p style={{ color: "#7f8c8d", margin: 0 }}>
          Recomendaciones, noticias y actualizaciones de tu clínica.
        </p>
      </div>

      {cargando ? (
        <div
          style={{ textAlign: "center", color: "#7f8c8d", marginTop: "50px" }}
        >
          Cargando publicaciones...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          {publicaciones.map((post) => (
            <div
              key={post.id}
              style={{
                backgroundColor: "white",
                borderRadius: "10px",
                padding: "25px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                border: "1px solid #eaeaea",
              }}
            >
              {/* Cabecera del Post (Autor y Fecha) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                  borderBottom: "1px solid #f0f0f0",
                  paddingBottom: "15px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "45px",
                      height: "45px",
                      borderRadius: "50%",
                      backgroundColor: "#34495e",
                      color: "white",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    {post.doctorNombre.charAt(0)}
                  </div>
                  <div>
                    <h4
                      style={{ margin: 0, color: "#2c3e50", fontSize: "16px" }}
                    >
                      {post.doctorNombre}
                    </h4>
                    <span style={{ fontSize: "13px", color: "#95a5a6" }}>
                      {new Date(post.fecha).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Etiqueta Visual */}
                <span
                  style={{
                    backgroundColor: obtenerColorEtiqueta(post.tipo),
                    color: "white",
                    padding: "5px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {post.tipo}
                </span>
              </div>

              {/* Contenido del Post */}
              <div>
                <h3
                  style={{
                    margin: "0 0 10px 0",
                    color: "#2c3e50",
                    fontSize: "20px",
                  }}
                >
                  {post.titulo}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "#555",
                    lineHeight: "1.6",
                    fontSize: "15px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {post.contenido}
                </p>
              </div>

              {/* Botón de Interacción (Opcional, estilo Facebook) */}
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "15px",
                  borderTop: "1px solid #f0f0f0",
                  display: "flex",
                  gap: "15px",
                }}
              >
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "#7f8c8d",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontWeight: "bold",
                  }}
                >
                  👍 Me resulta útil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
