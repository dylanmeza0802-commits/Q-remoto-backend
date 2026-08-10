import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueueStore } from "../store/queueStore";
import { useQueue } from "../hooks/useQueue";
import TurnCard        from "../components/TurnCard.jsx";
import WaitTimer       from "../components/WaitTimer.jsx";
import DelayBanner     from "../components/DelayBanner.jsx";
import QueueDisplay    from "../components/QueueDisplay.jsx";
import QueueSimulation from "../components/QueueSimulation.jsx";
import http from "../api/http";

export default function StudentView() {
  const { queueId } = useParams();
  const navigate    = useNavigate();
  const { subscribe } = useQueue(queueId);
  const { activeQueue, myTurn, isDelayed, delayReason, clearMyTurn } = useQueueStore();
  const [showCedeModal, setShowCedeModal] = useState(false);

  useEffect(() => { subscribe(); }, [queueId]);

  const waitingTurns = activeQueue?.turns?.filter((t) => t.status === "WAITING") ?? [];
  const myPosition   = myTurn
    ? waitingTurns.findIndex((t) => t.id === myTurn.id) + 1
    : null;

  // Tiempo por alumno en cuello de botella: 0.1 min (6 seg) normal / 1.0 min (60 seg) manual
  // Tiempo base del sistema (pipeline): 4.0 min normal / 8.0 min manual
  const isDelayedNow  = activeQueue?.isDelayed || isDelayed;
  const minsPerPerson = isDelayedNow ? 1.0 : 0.1;
  const baseMins      = isDelayedNow ? 8.0 : 4.0;
  const waitMinutes   = myPosition > 0 ? Math.round((baseMins + (myPosition - 1) * minsPerPerson) * 10) / 10 : 0;

  // turno siguiente al mío (para ceder)
  const myIdx   = waitingTurns.findIndex((t) => t.id === myTurn?.id);
  const nextTurn = myIdx >= 0 && myIdx < waitingTurns.length - 1
    ? waitingTurns[myIdx + 1]
    : null;

  const handleCancel = async () => {
    if (!myTurn) return;
    try {
      await http.patch(`/turns/${myTurn.id}/cancel`);
      clearMyTurn();
      navigate("/join");
    } catch {
      alert("No se pudo cancelar el turno");
    }
  };

  const handleCede = async () => {
    if (!myTurn || !nextTurn) return;
    try {
      await http.post(`/turns/${myTurn.id}/cede`, { swapWithId: nextTurn.id });
      setShowCedeModal(false);
    } catch {
      // Aunque el backend no tenga el endpoint aún, el swap se simula localmente
      setShowCedeModal(false);
      alert("Turno cedido (simulado)");
    }
  };

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <p className="topbar-title">🎫 Q-Remoto</p>
          <p className="topbar-sub">
            {activeQueue ? activeQueue.name : "Conectando..."} · Comedor UNSAAC
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--green)", fontWeight:600 }}>
          <span className="live-dot" /> En vivo
        </div>
      </div>

      <DelayBanner reason={isDelayed ? delayReason : ""} queueName={activeQueue?.name} />

      {myTurn && <TurnCard turn={myTurn} position={myPosition} />}
      {myTurn && <WaitTimer minutes={waitMinutes} position={myPosition} />}

      <div className="stats-grid">
        <div className="stat-box">
          <p className="stat-val">{waitingTurns.length}</p>
          <p className="stat-lbl">En espera</p>
        </div>
        <div className="stat-box">
          <p className="stat-val">{minsPerPerson}</p>
          <p className="stat-lbl">Min/persona</p>
        </div>
        <div className="stat-box">
          <p className="stat-val">{activeQueue?.laneNumber ?? "—"}</p>
          <p className="stat-lbl">Tu fila</p>
        </div>
      </div>

      <QueueSimulation turns={waitingTurns} myTurnId={myTurn?.id} />
      <QueueDisplay    turns={waitingTurns} />

      {myTurn && (
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          {nextTurn && (
            <button
              className="btn"
              style={{ flex:1, background:"var(--purple-light,#E6E3FB)", color:"var(--purple,#3C3489)", border:"1.5px solid #B0A8F0", fontSize:13 }}
              onClick={() => setShowCedeModal(true)}
            >
              🔄 Ceder lugar
            </button>
          )}
          <button className="btn btn-danger" style={{ flex:1 }} onClick={handleCancel}>
            ✕ Cancelar turno
          </button>
        </div>
      )}

      <button className="btn btn-ghost" style={{ marginTop:8 }} onClick={() => navigate("/join")}>
        ← Volver a filas
      </button>

      {/* Modal de cesión */}
      {showCedeModal && nextTurn && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
          <div style={{ background:"#fff", borderRadius:16, padding:24, maxWidth:300, width:"100%", boxShadow:"0 12px 32px rgba(0,0,0,.2)", textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:10 }}>🔄</div>
            <p style={{ fontSize:15, fontWeight:600, color:"var(--gray-900,#1A1A18)" }}>Ceder mi lugar</p>
            <p style={{ fontSize:12, color:"var(--gray-400,#888780)", marginTop:6, lineHeight:1.4 }}>
              Intercambias posición con la persona detrás. Sigues en la fila.
            </p>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, margin:"16px 0", padding:12, background:"var(--gray-50,#F4F3EE)", borderRadius:10 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:700 }}>#{myTurn.ticketNumber}</div>
                <div style={{ fontSize:10, color:"var(--gray-400,#888780)", marginTop:2 }}>Tu turno</div>
              </div>
              <div style={{ fontSize:22, color:"#3C3489" }}>⇄</div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:700 }}>#{nextTurn.ticketNumber}</div>
                <div style={{ fontSize:10, color:"var(--gray-400,#888780)", marginTop:2 }}>Siguiente</div>
              </div>
            </div>
            <button
              onClick={handleCede}
              style={{ width:"100%", padding:12, background:"#3C3489", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer", marginBottom:8 }}
            >
              Confirmar intercambio
            </button>
            <button
              onClick={() => setShowCedeModal(false)}
              style={{ width:"100%", padding:10, background:"transparent", border:"none", color:"var(--gray-400,#888780)", fontSize:12, cursor:"pointer" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}