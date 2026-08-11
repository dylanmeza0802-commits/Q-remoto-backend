import { create } from "zustand";

const savedTurn = (() => {
  try {
    const raw = localStorage.getItem("qremoto_my_turn");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

export const useQueueStore = create((set) => ({
  queues:      [],
  activeQueue: null,
  myTurn:      savedTurn,
  isDelayed:   false,
  delayReason: "",

  setQueues:      (queues)  => set({ queues }),
  setActiveQueue: (queue)   => set({ activeQueue: queue }),
  setMyTurn:      (turn)    => {
    if (turn) {
      localStorage.setItem("qremoto_my_turn", JSON.stringify(turn));
    } else {
      localStorage.removeItem("qremoto_my_turn");
    }
    set({ myTurn: turn });
  },
  clearMyTurn:    ()        => {
    localStorage.removeItem("qremoto_my_turn");
    set({ myTurn: null });
  },
  setDelay:       (reason)  => set({ isDelayed: true, delayReason: reason }),
  clearDelay:     ()        => set({ isDelayed: false, delayReason: "" }),
  updateQueue:    (updated) =>
    set((state) => ({
      activeQueue:
        state.activeQueue?.id === updated.id ? updated : state.activeQueue,
    })),
}));