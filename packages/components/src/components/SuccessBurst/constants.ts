const BURST_PIECES = 22
export const BURST_DURATION_MS = 1900
export const MARK_DURATION_MS = 420
export const PIECE_SIZE = 8

export const PIECES = Array.from({ length: BURST_PIECES }, (_, i) => {
  const angle = (i / BURST_PIECES) * Math.PI * 2
  const spread = 0.62 + ((i * 37) % 40) / 100
  return {
    x: Math.cos(angle) * spread,
    y: Math.sin(angle) * spread,
    drift: ((i * 53) % 30) / 100,
    delay: ((i * 29) % 22) * 10,
    tilt: (i * 47) % 360,
    tone: i % 4
  }
})
