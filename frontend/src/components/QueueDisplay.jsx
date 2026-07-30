import { useQueueStore } from "../store/queueStore";

export default function QueueDisplay({ turns = [] }) {
  const { isDelayed, activeQueue } = useQueueStore();
  const isDelayedNow = isDelayed || activeQueue?.isDelayed;
  const minsPerPerson = isDelayedNow ? 8.5 : 4.5;

  return (
    <div className="card">
      <p className="card-title">En espera · {turns.length} personas</p>
      {turns.length === 0 ? (
        <p style={{ fontSize:12, color:"var(--gray-400)" }}>No hay personas en esta fila</p>
      ) : (
        turns.slice(0, 6).map((t, i) => (
          <div className={`q-row ${i === 0 ? "q-row-first" : ""}`} key={t.id}>
            <span className="q-num">#{t.ticketNumber}</span>
            <span className="q-time">{i === 0 ? "Próximo" : `~${Math.round(i * minsPerPerson)} min`}</span>
          </div>
        ))
      )}
    </div>
  );
}