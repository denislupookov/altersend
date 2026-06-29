import { create } from 'zustand'

interface PairingSessionState {
  activeCount: number
  startPairing: () => void
  endPairing: () => void
}

export const usePairingSessionStore = create<PairingSessionState>((set) => ({
  activeCount: 0,
  startPairing: () => set((s) => ({ activeCount: s.activeCount + 1 })),
  endPairing: () => set((s) => ({ activeCount: Math.max(0, s.activeCount - 1) }))
}))
