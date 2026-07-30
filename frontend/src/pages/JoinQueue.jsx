import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueueStore } from "../store/queueStore";
import { useAuthStore } from "../store/authStore";
import http from "../api/http";
import ChangePasswordModal from "../components/ChangePasswordModal.jsx";

export default function JoinQueue() {
  const [queues,   setQueues]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const { setMyTurn } = useQueueStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    http.get("/queues")
      .then((r) => setQueues(r.data))
      .catch(() =>
        setQueues([
          { id:"q1", name:"Fila 1", laneNumber:1, isDelayed:false, turns:[] },
          { id:"q2", name:"Fila 2", laneNumber:2, isDelayed:true,  turns:[] },
          { id:"q3", name:"Fila 3", laneNumber:3, isDelayed:false, turns:[] },
        ])
      );
  }, []);

  const handleJoin = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { data } = await http.post(`/queues/${selected}/join`, {});
      setMyTurn(data.turn);
      navigate(`/queue/${selected}`);
    } catch {
      alert("No se pudo unir a la fila, intenta de nuevo");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <p className="topbar-title">🎫 Q-Remoto</p>
          <p className="topbar-sub">Comedor UNSAAC</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--green)", fontWeight:600 }}>
            <span className="live-dot" /> En vivo
          </div>
          <button
            className="btn-logout"
            style={{ background: "rgba(55, 138, 221, 0.1)", color: "var(--blue)", borderColor: "var(--blue-border)", padding: "7px 10px" }}
            onClick={() => setShowPwModal(true)}
            title="Cambiar contraseña"
          >
            🔑 Clave
          </button>
          <button
            id="student-logout-btn"
            className="btn-logout"
            onClick={handleLogout}
            title={`Cerrar sesión (${user?.name ?? ""})`}
          >
            ⬅ Salir
          </button>
        </div>
      </div>

      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}

      <div style={{ textAlign:"center", padding:"24px 0 20px" }}>
        <div style={{ width:60, height:60, borderRadius:"50%", background:"var(--blue-light)", border:"2px solid var(--blue-border)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:28 }}>
          🎟️
        </div>
        <h1 style={{ fontSize:20, fontWeight:700, color:"var(--gray-900)" }}>Solicitar turno</h1>
        <p style={{ fontSize:13, color:"var(--gray-400)", marginTop:6 }}>
          Elige la fila a la que quieres unirte
        </p>
        {user && (
          <p style={{ fontSize:12, color:"var(--blue)", marginTop:4, fontWeight:600 }}>
            👋 Hola, {user.name}
          </p>
        )}
      </div>

      {queues.map((q) => (
        <div
          key={q.id}
          className={`queue-option ${selected === q.id ? "active" : ""}`}
          onClick={() => setSelected(q.id)}
        >
          <div>
            <p className="queue-option-name">🚪 {q.name}</p>
            <p className="queue-option-info">
              {q.turns?.length ?? 0} personas · ~{Math.round((q.turns?.length ?? 0) * (q.isDelayed ? 8.5 : 4.5))} min espera
            </p>
          </div>
          <span className={`badge ${q.isDelayed ? "badge-amber" : "badge-green"}`}>
            {q.isDelayed ? "Retraso" : "Disponible"}
          </span>
        </div>
      ))}

      <button
        className="btn btn-primary"
        style={{ marginTop:8 }}
        onClick={handleJoin}
        disabled={!selected || loading}
      >
        {loading ? "Uniéndose..." : "🎫 Unirme a la fila"}
      </button>
    </div>
  );
}