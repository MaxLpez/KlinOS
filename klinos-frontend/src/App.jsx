import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClinicaProvider } from "./ClinicaContext.jsx";
import axios from "axios";

// Importamos tus páginas
import Login from "./pages/Login";
import PanelDoctor from "./pages/PanelDoctor";
import PanelPaciente from "./pages/PanelPaciente";
import ProtectedRoute from "./components/ProtectedRoute";
import PanelClinica from "./pages/PanelClinica.jsx";
import LandingPage from "./pages/LandingPage";
import RegistroClinica from "./pages/RegistroClinica";

// ==========================================
// EL INTERCEPTOR DE AXIOS (Guardaespaldas)
// ==========================================
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    // Le pegamos el token como un gafete a cada petición
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Opcional: Interceptor para cuando el token expira (Error 401)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("🚨 EL BACKEND RECHAZÓ EL TOKEN (401) EN LA RUTA:", error.config.url);
      // Si el servidor rechaza el token (expiró), borramos todo y lo mandamos al login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

function App() {
  return (
    <BrowserRouter>
      <ClinicaProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/registro-clinica" element={<RegistroClinica />} />

          {/* Rutas protegidas para DOCTOR */}
          
          <Route
            path="/panel-doctor"
            element={
              <ProtectedRoute requiredRole="Doctor">
                <PanelDoctor />
              </ProtectedRoute>
            }
          />

          {/* Rutas protegidas para PACIENTE */}
          <Route
            path="/panel-paciente"
            element={
              <ProtectedRoute requiredRole="Paciente">
                <PanelPaciente />
              </ProtectedRoute>
            }
          />

          <Route path="/panel-clinica" element={<PanelClinica />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </ClinicaProvider>
    </BrowserRouter>
  );
}

export default App;
