import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const { login, logout, error, clearError, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  // Si ya hay sesión activa, redirigir con useEffect (no en el render)
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "admin" ? "/admin" : "/join", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Limpiar errores al desmontar
  useEffect(() => {
    return () => clearError();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    // Pequeño delay para feedback visual del spinner
    setTimeout(() => {
      const ok = login(email, password);
      setLoading(false);
      if (ok) {
        // La redirección la maneja el useEffect de arriba
      }
    }, 500);
  };

  // Si ya está autenticado, no mostrar nada mientras redirige
  if (isAuthenticated && user) return null;

  return (
    <div className="login-page">
      {/* Círculos decorativos animados */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-card">
        {/* Logo / Encabezado */}
        <div className="login-header">
          <div className="login-logo">
            <span className="login-logo-icon">🎓</span>
          </div>
          <h1 className="login-title">Q-Remoto</h1>
          <p className="login-subtitle">Comedor Universitario · UNSAAC</p>
        </div>

        {/* Divider */}
        <div className="login-divider">
          <span>Inicia sesión para continuar</span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email */}
          <div className="login-field">
            <label htmlFor="login-email" className="login-label">
              Correo institucional
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon">✉️</span>
              <input
                id="login-email"
                type="email"
                className="login-input"
                placeholder="usuario@unsaac.edu.pe"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="login-field">
            <label htmlFor="login-password" className="login-label">
              Contraseña
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon">🔒</span>
              <input
                id="login-password"
                type={showPw ? "text" : "password"}
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          {/* Botón */}
          <button
            id="login-submit-btn"
            type="submit"
            className="btn login-btn"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              "Ingresar →"
            )}
          </button>
        </form>

        {/* Hint de credenciales */}
        <div className="login-hints">
          <div className="login-hint">
            <span className="login-hint-badge login-hint-badge-blue">👨‍🎓 Alumno</span>
            <code>alumno@unsaac.edu.pe · alumno123</code>
          </div>
          <div className="login-hint">
            <span className="login-hint-badge login-hint-badge-green">🛠️ Admin</span>
            <code>admin@unsaac.edu.pe · admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
