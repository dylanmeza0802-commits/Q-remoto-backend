import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/**
 * Protege una ruta según autenticación y rol.
 * @param {string} allowedRole - "student" | "admin" | undefined (cualquier rol)
 */
export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, user } = useAuthStore();

  // Sin sesión → Login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Rol incorrecto → redirigir a su ruta correcta
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/join"} replace />;
  }

  return children;
}
