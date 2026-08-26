import { createContext, useState, useEffect } from "react";
import axios from "axios";

// 1. Creamos el Contexto
export const ClinicaContext = createContext();

// 2. Creamos el Proveedor que envolverá la app
export const ClinicaProvider = ({ children }) => {
  const [datosGlobales, setDatosGlobales] = useState({
    nombre_Clinica: "Cargando...",
    ruta_Local_Logo: ""
  });

  const cargarDatosGlobales = async () => {
    try {
      const token = localStorage.getItem("token");
      let idClinica = 1; // Por defecto

      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        idClinica = payload.clinicaId || payload.Clinica_ID || 1;
      }

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/Clinicas/${idClinica}`);
      setDatosGlobales({
        nombre_Clinica: res.data.nombre_Clinica || res.data.Nombre_Clinica || "Mi Clínica",
        ruta_Local_Logo: res.data.ruta_Local_Logo || res.data.Ruta_Local_Logo || ""
      });
    } catch (error) {
      console.error("Error al cargar la info global de la clínica:", error);
      setDatosGlobales({ nombre_Clinica: "Clínica No Disponible", ruta_Local_Logo: "" });
    }
  };

  useEffect(() => {
    cargarDatosGlobales();
  }, []);

  // Exponemos los datos y también la función para recargarlos (por si los editan)
  return (
    <ClinicaContext.Provider value={{ datosGlobales, cargarDatosGlobales }}>
      {children}
    </ClinicaContext.Provider>
  );
};