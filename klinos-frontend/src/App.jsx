import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from 'axios';

// Importamos tus páginas
import Login from './pages/Login';
import PanelDoctor from './pages/PanelDoctor';
import PanelPaciente from './pages/PanelPaciente';
import ProtectedRoute from './components/ProtectedRoute';
import PanelClinica from './pages/PanelClinica.jsx';

// ==========================================
// EL INTERCEPTOR DE AXIOS (Guardaespaldas)
// ==========================================
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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
      // Si el servidor rechaza el token (expiró), borramos todo y lo mandamos al login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
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
        
        <Route path="*" element={<Login />} />
      
            <Route path="/panel-clinica" element={
        <PanelClinica />} />
      
      </Routes>


    </BrowserRouter>
  );
}

export default App;