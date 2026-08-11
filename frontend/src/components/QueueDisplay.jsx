import { useQueueStore } from "../store/queueStore";

export default function QueueDisplay({ turns = [] }) {
  const { isDelayed, activeQueue } = useQueueStore();
  const isDelayedNow  = isDelayed || activeQueue?.isDelayed;
  const minsPerPerson = isDelayedNow ? 0.25 : 0.1; // 0.1 = 6 seg / 0.25 = 15 seg
  const baseMins      = isDelayedNow ? 5.0 : 4.0;

  return (
    <div className="card">
      <p className="card-title">En espera · {turns.length} personas</p>
      {turns.length === 0 ? (
        <p style={{ fontSize:12, color:"var(--gray-400)" }}>No hay personas en esta fila</p>
      ) : (
        turns.slice(0, 6).map((t, i) => {
          let timeText = `~${Math.round(baseMins)} min`;
          if (i > 0) {
            const mins = baseMins + (i * minsPerPerson);
            const m = Math.floor(mins);
            const s = Math.round((mins % 1) * 60);
            timeText = m === 0 ? `~${s} seg` : (s === 0 ? `~${m} min` : `~${m} min ${s} s`);
          }
          return (
            <div className={`q-row ${i === 0 ? "q-row-first" : ""}`} key={t.id}>
              <span className="q-num">#{t.ticketNumber}</span>
              <span className="q-time">{i === 0 ? "Próximo" : timeText}</span>
            </div>
          );
        })
      )}
    </div>
  );
}