import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PanelChatDoctor from "../components/chat/PanelChatDoctor";

export default function PanelDoctor() {
  // ==========================================
  // 1. ESTADOS
  // ==========================================
  const [vistaActiva, setVistaActiva] = useState("citas");
  const [citas, setCitas] = useState([]);

  const [expedientesOriginales, setExpedientesOriginales] = useState([]);
  const [expedientes, setExpedientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [pacienteExpandido, setPacienteExpandido] = useState(null);
  const [pacientes, setPacientes] = useState([]);

  // Estados para Nueva Cita
  const [mostrarModalCita, setMostrarModalCita] = useState(false);
  const [datosNuevaCita, setDatosNuevaCita] = useState({
    paciente_ID: "",
    clinica_ID: "",
    fecha: "",
    motivo: "",
  });
  const [busquedaPaciente, setBusquedaPaciente] = useState("");
  const [archivoAdjunto, setArchivoAdjunto] = useState(null);

  // Estados para Atender Cita (Crear Expediente)
  const [citaActiva, setCitaActiva] = useState(null);
  const [datosConsulta, setDatosConsulta] = useState({
    diagnostico: "",
    recomendaciones: "",
  });

  const navigate = useNavigate();

  // ==========================================
  // 2. EFECTOS INICIALES (Carga de datos)
  // ==========================================
  useEffect(() => {
    cargarCitas();
    cargarExpedientes();
    cargarPacientes();
  }, []);

  const cargarCitas = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Citas/MisCitas`,
      );

      const citasPendientes = res.data.filter(
        (cita) => cita.estado !== "Atendida",
      );

      setCitas(citasPendientes);
    } catch (error) {
      console.error("Error al cargar citas", error);
    }
  };

  const cargarPacientes = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Pacientes`,
      );
      setPacientes(res.data);
    } catch (error) {
      console.error("Error al cargar pacientes", error);
    }
  };

  const cargarExpedientes = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Expedientes/MisExpedientes`,
      );

      const agrupados = res.data.reduce((acc, exp) => {
        const idPaciente =
          exp.paciente?.id ||
          exp.pacienteId ||
          exp.paciente_ID ||
          "Desconocido";

        if (!acc[idPaciente])
          acc[idPaciente] = { pacienteId: idPaciente, historial: [] };
        acc[idPaciente].historial.push(exp);
        return acc;
      }, {});

      const listaAgrupada = Object.values(agrupados);

      setExpedientesOriginales(listaAgrupada);
      setExpedientes(listaAgrupada);
    } catch (error) {
      console.error("Error al cargar expedientes", error);
    }
  };

  // ==========================================
  // 3. FUNCIONES DE INTERFAZ Y GUARDADO
  // ==========================================
  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const manejarBusqueda = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);

    if (valor.trim() === "") {
      setExpedientes(expedientesOriginales);
      return;
    }

    const termino = valor.toLowerCase().trim();
    const filtrados = expedientesOriginales.filter((p) => {
      const nombreEncontrado =
        p.historial.find((h) => h.paciente)?.paciente?.nombre_Completo || "";
      return (
        p.pacienteId.toString().includes(termino) ||
        nombreEncontrado.toLowerCase().includes(termino)
      );
    });

    setExpedientes(filtrados);
  };

  const togglePaciente = (id) => {
    setPacienteExpandido(pacienteExpandido === id ? null : id);
  };

  const handleCrearCita = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/Citas`, {
        Paciente_ID: parseInt(datosNuevaCita.paciente_ID),
        fecha_Hora: datosNuevaCita.fecha,
        motivo_Consulta: datosNuevaCita.motivo,
        estado: "Pendiente",
      });

      setMostrarModalCita(false);
      setDatosNuevaCita({
        paciente_ID: "",
        clinica_ID: "",
        fecha: "",
        motivo: "",
      });
      setBusquedaPaciente("");
      cargarCitas();
    } catch (error) {
      console.error("Error al crear la cita:", error);
      const msg = error.response?.data?.mensaje || "Hubo un error al agendar.";
      alert(msg);
    }
  };

  const handleGuardarExpediente = async (e) => {
    e.preventDefault();
    try {
      // 🛡️ ADAPTABILIDAD: Extraemos el ID del paciente ya sea de la estructura nueva o vieja
      const idEncontrado =
        citaActiva.pacienteId ||
        citaActiva.paciente_ID ||
        citaActiva.PacienteId ||
        citaActiva.paciente?.id ||
        citaActiva.paciente?.Id;

      const pacienteIdSeguro = parseInt(idEncontrado);

      if (!pacienteIdSeguro || pacienteIdSeguro === 0) {
        alert("No se pudo detectar el ID del paciente.");
        return;
      }

      const paqueteParaEnviar = {
        Paciente_ID: pacienteIdSeguro,
        Diagnostico: datosConsulta.diagnostico,
        Recomendaciones: datosConsulta.recomendaciones,
      };

      const resExpediente = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Expedientes`,
        paqueteParaEnviar,
      );

      const nuevoExpedienteId = resExpediente.data.id || resExpediente.data.Id;

      if (archivoAdjunto && nuevoExpedienteId) {
        const formData = new FormData();
        formData.append("archivo", archivoAdjunto);

        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/Expedientes/${nuevoExpedienteId}/SubirEstudio`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
      }

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/Citas/${citaActiva.id || citaActiva.Id}/MarcarAtendida`,
      );

      alert("¡Expediente guardado exitosamente!");

      setCitaActiva(null);
      setDatosConsulta({ diagnostico: "", recomendaciones: "" });
      setArchivoAdjunto(null);

      cargarExpedientes();
      cargarCitas();
    } catch (error) {
      console.error("Error al guardar expediente o archivo:", error);
      const msg = error.response?.data?.mensaje || "Hubo un problema al procesar la atención.";
      alert(msg);
    }
  };

  const obtenerNombrePaciente = (cita) => {
    // 1. Si la cita ya trae el objeto 'paciente' optimizado desde C#
    if (cita.paciente) {
      if (cita.paciente.nombre_Completo) return cita.paciente.nombre_Completo;
      if (cita.paciente.nombre_completo) return cita.paciente.nombre_completo;
    }

    // 2. Respaldo buscando en la lista general de pacientes cargada en el estado
    const idBuscado = cita.pacienteId || cita.paciente_ID || cita.PacienteId;
    const pacienteEncontrado = pacientes.find(
      (p) => p.id === idBuscado || p.Id === idBuscado,
    );

    if (pacienteEncontrado) {
      return pacienteEncontrado.nombre_Completo || pacienteEncontrado.Nombre_Completo || pacienteEncontrado.nombre_completo;
    }

    return `ID: ${idBuscado} (Sin nombre)`;
  };

  // ==========================================
  // 4. DATOS DINÁMICOS DEL DOCTOR (JWT)
  // ==========================================
  const obtenerDatosDoctor = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return { doctorId: 0, clinicaId: 1 };

      const payload = JSON.parse(atob(token.split(".")[1]));
      const idStr =
        payload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] ||
        payload.nameid ||
        payload.sub;

      return {
        doctorId: parseInt(idStr) || 0,
        clinicaId: payload.clinicaId ? parseInt(payload.clinicaId) : 1,
      };
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return { doctorId: 0, clinicaId: 1 };
    }
  };

  const infoDoctor = obtenerDatosDoctor();

  // ==========================================
  // 5. RENDERIZADO VISUAL
  // ==========================================
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        margin: 0,
      }}
    >
      {/* --- BARRA LATERAL --- */}
      <div
        style={{
          width: "250px",
          backgroundColor: "#2c3e50",
          color: "white",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2>KlinOS</h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            marginTop: "30px",
            flexGrow: 1,
          }}
        >
          <li
            onClick={() => setVistaActiva("citas")}
            style={{
              padding: "10px 0",
              borderBottom: "1px solid #34495e",
              cursor: "pointer",
              color: vistaActiva === "citas" ? "white" : "#95a5a6",
            }}
          >
            📅 Mis Citas
          </li>
          <li
            onClick={() => setVistaActiva("expedientes")}
            style={{
              padding: "10px 0",
              borderBottom: "1px solid #34495e",
              cursor: "pointer",
              color: vistaActiva === "expedientes" ? "white" : "#95a5a6",
            }}
          >
            📁 Expedientes
          </li>
          <li
            onClick={() => setVistaActiva("chat")}
            style={{
              padding: "10px 0",
              borderBottom: "1px solid #34495e",
              cursor: "pointer",
              color: vistaActiva === "chat" ? "white" : "#95a5a6",
            }}
          >
            💬 Mensajes
          </li>
          <li
            onClick={() => setVistaActiva("publicar")}
            style={{
              padding: "10px 0",
              borderBottom: "1px solid #34495e",
              cursor: "pointer",
              color: vistaActiva === "publicar" ? "white" : "#95a5a6",
            }}
          >
            📢 Publicar
          </li>
        </ul>

        <div
          onClick={cerrarSesion}
          style={{
            padding: "15px 0",
            borderTop: "1px solid #34495e",
            cursor: "pointer",
            color: "#e74c3c",
            fontWeight: "bold",
            marginTop: "auto",
          }}
        >
          🚪 Cerrar Sesión
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div
        style={{
          flex: 1,
          padding: "40px",
          backgroundColor: "#f4f6f9",
          position: "relative",
        }}
      >
        {/* VISTA: CITAS */}
        {vistaActiva === "citas" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>Mis Citas Programadas</h2>
              <button
                onClick={() => setMostrarModalCita(true)}
                style={{
                  padding: "10px 15px",
                  backgroundColor: "#2ecc71",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                + Nueva Cita
              </button>
            </div>

            <ul style={{ listStyle: "none", padding: 0 }}>
              {citas.map((cita) => (
                <li
                  key={cita.id || cita.Id}
                  style={{
                    backgroundColor: "white",
                    padding: "20px",
                    marginBottom: "15px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>
                      👤 Paciente: {obtenerNombrePaciente(cita)}
                    </h4>
                    <p style={{ margin: "5px 0", color: "#7f8c8d" }}>
                      <strong>📅 Fecha:</strong>{" "}
                      {cita.fecha_Hora
                        ? new Date(cita.fecha_Hora).toLocaleString()
                        : "Fecha no asignada"}
                    </p>
                    <p style={{ margin: "5px 0", color: "#7f8c8d" }}>
                      <strong>💬 Motivo:</strong>{" "}
                      {cita.motivo_Consulta || "Sin motivo específico"}
                    </p>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "10px",
                        padding: "5px 10px",
                        backgroundColor:
                          cita.estado === "Pendiente" ? "#f1c40f" : "#2ecc71",
                        color: cita.estado === "Pendiente" ? "#000" : "#fff",
                        borderRadius: "15px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {cita.estado || "Pendiente"}
                    </span>
                  </div>

                  <button
                    onClick={() => setCitaActiva(cita)}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#3498db",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      height: "fit-content",
                    }}
                  >
                    🩺 Atender
                  </button>
                </li>
              ))}
            </ul>

            {citas.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "#95a5a6",
                  marginTop: "40px",
                }}
              >
                No tienes citas agendadas aún. Usa el botón "+ Nueva Cita" para
                comenzar.
              </p>
            )}
          </div>
        )}

        {/* VISTA: EXPEDIENTES */}
        {vistaActiva === "expedientes" && (
          <div>
            <h2>Gestión de Expedientes</h2>
            <input
              type="text"
              maxLength="50"
              placeholder="🔍 Buscar por ID o Nombre del paciente..."
              value={busqueda}
              onChange={manejarBusqueda}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "20px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />

            {expedientes.map((paciente) => (
              <div
                key={paciente.pacienteId}
                style={{
                  marginBottom: "10px",
                  backgroundColor: "white",
                  borderRadius: "5px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => togglePaciente(paciente.pacienteId)}
                  style={{
                    padding: "15px 20px",
                    backgroundColor: "#ecf0f1",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                  }}
                >
                  <span>
                    {paciente.historial[0].paciente?.nombre_Completo ||
                      `Paciente ID: ${paciente.pacienteId}`}
                  </span>
                  <span>
                    {pacienteExpandido === paciente.pacienteId
                      ? "▲ Ocultar"
                      : "▼ Ver Historial"}
                  </span>
                </div>

                {pacienteExpandido === paciente.pacienteId && (
                  <div style={{ padding: "20px" }}>
                    {paciente.historial.map((exp) => (
                      <div
                        key={exp.id}
                        style={{
                          borderBottom: "1px solid #eee",
                          paddingBottom: "10px",
                          marginBottom: "10px",
                        }}
                      >
                        <p>
                          <strong>Fecha:</strong>{" "}
                          {new Date(
                            exp.fechaConsulta ||
                              exp.FechaConsulta ||
                              exp.fecha_Consulta,
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Diagnóstico:</strong> {exp.diagnostico}
                        </p>
                        <p>
                          <strong>Recomendaciones:</strong>{" "}
                          {exp.recomendaciones}
                        </p>

                        {exp.archivos && exp.archivos.length > 0 && (
                          <div
                            style={{
                              marginTop: "15px",
                              padding: "10px",
                              backgroundColor: "#f9f9f9",
                              borderRadius: "5px",
                              border: "1px solid #e0e0e0",
                            }}
                          >
                            <strong style={{ color: "#2c3e50" }}>
                              📎 Estudios adjuntos:
                            </strong>
                            <ul
                              style={{
                                listStyle: "none",
                                padding: 0,
                                marginTop: "10px",
                              }}
                            >
                              {exp.archivos.map((arch) => (
                                <li
                                  key={arch.id}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "8px",
                                    paddingBottom: "8px",
                                    borderBottom: "1px solid #eee",
                                  }}
                                >
                                  <span>
                                    {arch.nombre_Original} ({arch.tamano_MB} MB)
                                  </span>

                                  <button
                                    onClick={() =>
                                      window.open(
                                        `${import.meta.env.VITE_API_URL}/api/Expedientes/Descargar/${arch.id}`,
                                        "_blank",
                                      )
                                    }
                                    style={{
                                      padding: "5px 10px",
                                      backgroundColor: "#34495e",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                    }}
                                  >
                                    ⬇️ Descargar
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {expedientes.length === 0 && (
              <p style={{ textAlign: "center", color: "#7f8c8d" }}>
                No se encontraron expedientes con ese criterio.
              </p>
            )}
          </div>
        )}

        {/* VISTA DEL PANEL DE CHAT */}
        {vistaActiva === "chat" && (
          <div style={{ height: "100%" }}>
            <h2 style={{ marginBottom: "20px" }}>Mensajería Directa</h2>
            <PanelChatDoctor
              clinicaId={infoDoctor.clinicaId}
              doctorId={infoDoctor.doctorId}
              listaPacientes={pacientes
                .map((p) => ({
                  id: p.id || p.Id || p.paciente_ID || 0,
                  nombre_Completo:
                    p.nombre_Completo ||
                    p.Nombre_Completo ||
                    p.nombre ||
                    `Paciente #${p.id}`,
                }))
                .filter((p) => p.id !== 0)}
            />
          </div>
        )}

        {/* VISTA: CREAR PUBLICACIÓN */}
        {vistaActiva === "publicar" && (
          <div
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#2c3e50" }}>
              Crear Nuevo Comunicado
            </h2>
            <p
              style={{
                color: "#7f8c8d",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              Comparte avisos, recomendaciones de salud o noticias con todos tus
              pacientes en tiempo real.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const titulo = e.target.titulo.value;
                const tipo = e.target.tipo.value;
                const contenido = e.target.contenido.value;

                try {
                  await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/Publicaciones`,
                    {
                      titulo: titulo,
                      tipo: tipo,
                      contenido: contenido,
                    },
                  );

                  alert("¡Publicación creada exitosamente!");
                  e.target.reset();
                  setVistaActiva("citas");
                } catch (error) {
                  console.error("Error al publicar:", error);
                  const msg = error.response?.data?.mensaje || "Hubo un error al guardar la publicación.";
                  alert(msg);
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#2c3e50",
                  }}
                >
                  Título del Comunicado:
                </label>
                <input
                  type="text"
                  name="titulo"
                  required
                  placeholder="Ej. Campaña de Vacunación..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#2c3e50",
                  }}
                >
                  Tipo de Publicación:
                </label>
                <select
                  name="tipo"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    backgroundColor: "white",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="Anuncio">Anuncio</option>
                  <option value="Recomendación">Recomendación</option>
                  <option value="Aviso">Aviso</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#2c3e50",
                  }}
                >
                  Contenido:
                </label>
                <textarea
                  name="contenido"
                  rows="5"
                  required
                  placeholder="Escribe los detalles aquí..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: "12px",
                  backgroundColor: "#2ecc71",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                🚀 Publicar en el Muro
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MODAL NUEVA CITA */}
      {mostrarModalCita && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "400px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Agendar Nueva Cita</h3>

            <form
              onSubmit={handleCrearCita}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Buscar Paciente:
                </label>

                <input
                  type="text"
                  placeholder="🔍 Escribe el nombre o ID..."
                  value={busquedaPaciente}
                  onChange={(e) => setBusquedaPaciente(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    marginBottom: "10px",
                  }}
                />

                <div
                  style={{
                    maxHeight: "140px",
                    overflowY: "auto",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  {pacientes
                    .filter(
                      (p) =>
                        p.nombre_Completo
                          ?.toLowerCase()
                          .includes(busquedaPaciente.toLowerCase()) ||
                        p.id?.toString().includes(busquedaPaciente),
                    )
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() =>
                          setDatosNuevaCita({
                            ...datosNuevaCita,
                            paciente_ID: p.id,
                          })
                        }
                        style={{
                          padding: "10px",
                          cursor: "pointer",
                          backgroundColor:
                            datosNuevaCita.paciente_ID === p.id
                              ? "#3498db"
                              : "white",
                          color:
                            datosNuevaCita.paciente_ID === p.id
                              ? "white"
                              : "#2c3e50",
                          borderBottom: "1px solid #eee",
                          transition: "background-color 0.2s",
                        }}
                      >
                        <strong>ID: {p.id}</strong> - {p.nombre_Completo}
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Fecha y Hora:
                </label>
                <input
                  type="datetime-local"
                  required
                  value={datosNuevaCita.fecha}
                  onChange={(e) =>
                    setDatosNuevaCita({
                      ...datosNuevaCita,
                      fecha: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Motivo:
                </label>
                <textarea
                  required
                  rows="3"
                  value={datosNuevaCita.motivo}
                  onChange={(e) =>
                    setDatosNuevaCita({
                      ...datosNuevaCita,
                      motivo: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalCita(false);
                    setBusquedaPaciente("");
                  }}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#3498db",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Guardar Cita gaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ATENDER CITA */}
      {citaActiva && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "500px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: "#2c3e50",
                borderBottom: "2px solid #ecf0f1",
                paddingBottom: "10px",
              }}
            >
              🩺 Atendiendo a: {obtenerNombrePaciente(citaActiva)}
            </h3>

            <p style={{ color: "#7f8c8d", fontStyle: "italic" }}>
              <strong>Motivo:</strong>{" "}
              {citaActiva.motivo_Consulta || "Sin especificar"}
            </p>

            <form
              onSubmit={handleGuardarExpediente}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Diagnóstico:
                </label>
                <textarea
                  required
                  rows="3"
                  value={datosConsulta.diagnostico}
                  onChange={(e) =>
                    setDatosConsulta({
                      ...datosConsulta,
                      diagnostico: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Recomendaciones:
                </label>
                <textarea
                  required
                  rows="3"
                  value={datosConsulta.recomendaciones}
                  onChange={(e) =>
                    setDatosConsulta({
                      ...datosConsulta,
                      recomendaciones: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  📎 Adjuntar Estudio (Opcional):
                </label>
                <input
                  type="file"
                  onChange={(e) => setArchivoAdjunto(e.target.files[0])}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px dashed #3498db",
                    backgroundColor: "#f0f8ff",
                    cursor: "pointer",
                  }}
                />
                {archivoAdjunto && (
                  <small
                    style={{
                      color: "#27ae60",
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    ✓ Archivo seleccionado: {archivoAdjunto.name}
                  </small>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContext: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setCitaActiva(null);
                    setArchivoAdjunto(null);
                    setDatosConsulta({ diagnostico: "", recomendaciones: "" });
                  }}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#95a5a6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#27ae60",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Guardar Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}