import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FloorLayout from "../components/FloorLayout.jsx";
import http from "../api/http";

export default function CanastaConfig() {
  const [floors,  setFloors]  = useState(1);
  const [lanes,   setLanes]   = useState(2);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSave = async () => {
    setLoading(true);
    try {
      await http.post("/canasta/configure", { floors, lanes });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Error al guardar configuración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wide">
      <div className="nav-tabs">
        <button className="nav-tab" onClick={() => navigate("/admin")}>📊 Panel Admin</button>
        <button className="nav-tab active">🎁 Canasta Navideña</button>
        <button className="nav-tab" onClick={() => navigate("/join")}>🎫 Vista alumno</button>
      </div>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:"var(--gray-900)" }}>Canasta Navideña</h1>
          <p style={{ fontSize:13, color:"var(--gray-400)", marginTop:4 }}>
            Configura pisos y filas para el evento
          </p>
        </div>
        <span className="badge badge-blue">Evento especial</span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div>
          <div className="card">
            <p className="card-title">Número de pisos</p>
            <div className="toggle-row">
              {[1, 2].map((n) => (
                <button key={n} className={`tog ${floors === n ? "active" : ""}`} onClick={() => setFloors(n)}>
                  {n} piso{n > 1 ? "s" : ""}
                </button>
              ))}
            </div>
            <p className="card-title" style={{ marginTop:16 }}>Filas por piso (máx. 2)</p>
            <div className="toggle-row">
              {[1, 2].map((n) => (
                <button key={n} className={`tog ${lanes === n ? "active" : ""}`} onClick={() => setLanes(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="card-title">Opciones del evento</p>
            <div className="opt-row"><span>Anuncio público de inicio</span><input type="checkbox" defaultChecked /></div>
            <div className="opt-row"><span>Código QR por fila</span><input type="checkbox" defaultChecked /></div>
            <div className="opt-row"><span>Notificación de retraso automática</span><input type="checkbox" /></div>
          </div>
        </div>

        <div className="card">
          <p className="card-title">Vista previa del layout</p>
          <FloorLayout floors={floors} lanes={lanes} />
          <p style={{ fontSize:12, color:"var(--gray-400)", marginTop:12, paddingTop:10, borderTop:"1px solid var(--gray-100)" }}>
            Total de filas activas: <strong style={{ color:"var(--blue)" }}>{floors * lanes}</strong>
          </p>
        </div>
      </div>

      <button
        className={`btn ${saved ? "btn-success" : "btn-primary"}`}
        style={{ marginTop:8 }}
        onClick={handleSave}
        disabled={loading}
      >
        {saved ? "✓ Configuración guardada" : loading ? "Guardando..." : "💾 Guardar configuración"}
      </button>
    </div>
  );
}