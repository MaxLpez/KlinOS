import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");

  // 1. Si no hay token, manda al login
  if (!token) {
    return <Navigate to="/login" />;
  }

  try {
    // 2. Decodificamos el token para ver qué rol tiene
    const payload = JSON.parse(atob(token.split('.')[1]));

    // 3. Si el rol no coincide, lo mandamos a su panel correcto
    if (payload.rol !== requiredRole) {
      return <Navigate to={payload.rol === "Doctor" ? "/panel-doctor" : "/panel-paciente"} />;
    }

    // 4. Si todo está bien, dejamos pasar
    return children;
  } catch (error) {
    // Si el token está corrupto, mandamos al login
    localStorage.removeItem("token");
    return <Navigate to="/login" />;
  }
}