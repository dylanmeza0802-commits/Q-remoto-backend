import { useState } from "react";
import { useAuthStore } from "../store/authStore";

export default function ChangePasswordModal({ onClose }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState("");

  const { changePassword, error, clearError } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (newPassword.length < 6) {
      setLocalError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const ok = changePassword(oldPassword, newPassword);
      setLoading(false);
      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    }, 600);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(12, 42, 86, 0.45)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 200,
      padding: 20
    }}>
      <div className="login-card" style={{
        margin: 0,
        maxWidth: 380,
        padding: "30px 24px",
        background: "rgba(255, 255, 255, 0.92)",
        color: "var(--gray-900)",
        borderColor: "var(--gray-200)",
        boxShadow: "var(--shadow-lg)"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--blue)" }}>Cambiar contraseña</h2>
          <p style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4 }}>
            Ingresa tu contraseña actual y define una nueva
          </p>
        </div>

        {success ? (
          <div style={{
            textAlign: "center",
            padding: "20px 0",
            animation: "card-in 0.3s ease"
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--green)" }}>¡Contraseña cambiada con éxito!</p>
            <p style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 4 }}>Cerrando ventana...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {/* Contraseña Antigua */}
            <div className="login-field">
              <label className="login-label" style={{ color: "var(--gray-700)" }}>Contraseña actual</label>
              <input
                type="password"
                className="login-input"
                style={{
                  color: "var(--gray-900)",
                  background: "var(--gray-50)",
                  borderColor: "var(--gray-200)",
                  padding: "10px 12px"
                }}
                placeholder="Ingresa tu contraseña actual"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            {/* Contraseña Nueva */}
            <div className="login-field">
              <label className="login-label" style={{ color: "var(--gray-700)" }}>Nueva contraseña (mín. 6 caracteres)</label>
              <input
                type="password"
                className="login-input"
                style={{
                  color: "var(--gray-900)",
                  background: "var(--gray-50)",
                  borderColor: "var(--gray-200)",
                  padding: "10px 12px"
                }}
                placeholder="Define tu nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirmar Contraseña Nueva */}
            <div className="login-field">
              <label className="login-label" style={{ color: "var(--gray-700)" }}>Confirmar nueva contraseña</label>
              <input
                type="password"
                className="login-input"
                style={{
                  color: "var(--gray-900)",
                  background: "var(--gray-50)",
                  borderColor: "var(--gray-200)",
                  padding: "10px 12px"
                }}
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Errores */}
            {(localError || error) && (
              <div className="login-error" style={{ fontSize: 12, padding: "8px 10px" }} role="alert">
                ⚠️ {localError || error}
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, padding: 10 }}
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, padding: 10 }}
                disabled={loading || !oldPassword || !newPassword || !confirmPassword}
              >
                {loading ? <span className="login-spinner" style={{ width: 14, height: 14, borderTopColor: "var(--blue)" }} /> : "Guardar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
