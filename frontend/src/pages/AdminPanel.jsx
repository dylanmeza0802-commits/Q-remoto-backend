import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import socket from "../api/socket";
import { useAuthStore } from "../store/authStore";
import ChangePasswordModal from "../components/ChangePasswordModal.jsx";

export default function AdminPanel() {
  const [queues, setQueues] = useState([]);
  const [feed,   setFeed]   = useState([]);
  const [served, setServed] = useState(0);
  const [showPwModal, setShowPwModal] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const addFeed = (color, text) =>
    setFeed((f) => [{ color, text, time:"ahora" }, ...f].slice(0, 8));

  useEffect(() => {
    http.get("/queues")
      .then((r) => setQueues(r.data))
      .catch(() => setQueues([]));

    socket.connect();
    socket.on("queue:update", (updated) =>
      setQueues((qs) => qs.map((q) => (q.id === updated.id ? updated : q)))
    );
    return () => { socket.off("queue:update"); socket.disconnect(); };
  }, []);

  const callNext = async (queueId, name) => {
    try {
      const { data } = await http.post(`/queues/${queueId}/call-next`);
      setServed((s) => s + 1);
      addFeed("var(--green)", `Turno #${data.ticketNumber} llamado · ${name}`);
    } catch {
      addFeed("var(--red)", `Sin turnos en ${name}`);
    }
  };

  const announceDelay = async (queueId, name) => {
    const reason = prompt("Motivo del retraso:");
    if (!reason) return;
    try {
      await http.patch(`/queues/${queueId}/delay`, { reason });
      setQueues((qs) => qs.map((q) => q.id === queueId ? { ...q, isDelayed:true, delayReason:reason } : q));
      addFeed("var(--amber)", `Retraso en ${name}: ${reason}`);
    } catch { alert("Error al anunciar retraso"); }
  };

  const resolveDelay = async (queueId, name) => {
    try {
      await http.patch(`/queues/${queueId}/delay/clear`);
      setQueues((qs) => qs.map((q) => q.id === queueId ? { ...q, isDelayed:false, delayReason:null } : q));
      addFeed("var(--green)", `Retraso resuelto · ${name}`);
    } catch { alert("Error al resolver retraso"); }
  };

  const totalWaiting = queues.reduce((acc, q) =>
    acc + (q.turns?.filter((t) => t.status === "WAITING").length ?? 0), 0);

  // Cuello de botella calibrado: 0.1 min (6 seg) normal / 1.0 min (60 seg) con retraso
  const anyDelayed = queues.some((q) => q.isDelayed);
  const avgMins    = anyDelayed ? "~60 seg" : "~6 seg";

  // Alerta de capacidad: con 1 sola fila el sistema colapsa para 2500 alumnos
  const activeQueueCount  = queues.filter((q) => q.isActive).length;
  const capacityWarning   = activeQueueCount < 2;

  return (
    <div className="page-wide">
      <div className="nav-tabs" style={{ justifyContent:"space-between", paddingRight:12 }}>
        <div style={{ display:"flex", flex:1 }}>
          <button className="nav-tab active">📊 Panel Admin</button>
          <button className="nav-tab" onClick={() => navigate("/canasta")}>🎁 Canasta</button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {user && (
            <span style={{ fontSize:12, color:"var(--gray-400)", fontWeight:500 }}>
              👤 {user.name}
            </span>
          )}
          <button
            className="btn-logout"
            style={{ background: "rgba(55, 138, 221, 0.1)", color: "var(--blue)", borderColor: "var(--blue-border)", padding: "7px 10px" }}
            onClick={() => setShowPwModal(true)}
            title="Cambiar contraseña"
          >
            🔑 Clave
          </button>
          <button
            id="admin-logout-btn"
            className="btn-logout"
            onClick={handleLogout}
          >
            ⬅ Salir
          </button>
        </div>
      </div>

      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}

      {capacityWarning && (
        <div style={{
          background:"linear-gradient(135deg,#7A1515,#E04B4B)", color:"#fff",
          borderRadius:12, padding:"12px 16px", marginBottom:12,
          display:"flex", alignItems:"center", gap:10, fontSize:13, fontWeight:600,
        }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div>
            <p>Solo 1 fila activa — capacidad insuficiente para 2500 alumnos</p>
            <p style={{ fontWeight:400, fontSize:11, marginTop:3, opacity:.85 }}>
              Para servir 2500 alumnos en 240 min se necesitan las 2 filas. Activa el Piso 2.
            </p>
          </div>
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-box"><p className="metric-val">{totalWaiting}</p><p className="metric-lbl">Total en espera</p></div>
        <div className="metric-box"><p className="metric-val">{served}</p><p className="metric-lbl">Atendidos hoy</p></div>
        <div className="metric-box"><p className="metric-val">~{avgMins}</p><p className="metric-lbl">Min promedio</p></div>
        <div className="metric-box"><p className="metric-val">{queues.filter((q) => q.isActive).length}</p><p className="metric-lbl">Filas activas</p></div>
      </div>

      <div className="admin-grid">
        {queues.map((q) => {
          const waiting = q.turns?.filter((t) => t.status === "WAITING") ?? [];
          return (
            <div className="lane-card" key={q.id}>
              <div className="lane-header">
                <p className="lane-title">🚪 {q.name}</p>
                <span className={`badge ${q.isDelayed ? "badge-amber" : "badge-green"}`}>
                  {q.isDelayed ? "Retraso" : "Activa"}
                </span>
              </div>
              {waiting.slice(0, 4).map((t, i) => {
                const mins     = q.isDelayed ? 1.0 : 0.1;
                const baseMins = q.isDelayed ? 8.0 : 4.0;
                let timeText = "Próximo";
                if (i > 0) {
                  const waitMins = baseMins + (i * mins);
                  const m = Math.floor(waitMins);
                  const s = Math.round((waitMins % 1) * 60);
                  timeText = m === 0 ? `~${s} seg` : (s === 0 ? `~${m} min` : `~${m} min ${s} s`);
                }
                return (
                  <div className={`q-row ${i === 0 ? "q-row-first" : ""}`} key={t.id}>
                    <span className="q-num">#{t.ticketNumber}</span>
                    <span className="q-time">{timeText}</span>
                  </div>
                );
              })}
              {waiting.length === 0 && (
                <p style={{ fontSize:12, color:"var(--gray-400)", padding:"6px 0" }}>Sin turnos</p>
              )}
              <div className="lane-actions">
                {q.isDelayed
                  ? <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={() => resolveDelay(q.id, q.name)}>✓ Resolver retraso</button>
                  : <button className="btn btn-warning btn-sm" style={{flex:1}} onClick={() => announceDelay(q.id, q.name)}>⏸ Retraso</button>
                }
              </div>
              <button className="btn btn-primary btn-sm" style={{marginTop:8}} onClick={() => callNext(q.id, q.name)}>
                📢 Llamar siguiente
              </button>
            </div>
          );
        })}
      </div>

      <div className="card">
        <p className="card-title">Actividad reciente</p>
        <div className="feed-list">
          {feed.length === 0 && (
            <p style={{ fontSize:12, color:"var(--gray-400)" }}>Sin actividad aún</p>
          )}
          {feed.map((f, i) => (
            <div className="feed-item" key={i}>
              <div className="feed-dot" style={{ background:f.color }} />
              <div>
                <p className="feed-text">{f.text}</p>
                <p className="feed-time">{f.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}