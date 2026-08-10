export interface HeroBackdropStop {
  offset: number
  alpha: number
}

export const heroBackdrop = {
  height: 300,
  gridSize: 32,
  gridAlpha: 0.12,
  glowCenter: { x: 50, y: 0, radiusX: 72, radiusY: 58 },
  maskCenter: { x: 50, y: 30, radiusX: 72, radiusY: 62 },
  wash: [
    { offset: 0, alpha: 0.16 },
    { offset: 0.28, alpha: 0.08 },
    { offset: 0.52, alpha: 0.03 },
    { offset: 0.78, alpha: 0 }
  ] as HeroBackdropStop[],
  glow: [
    { offset: 0, alpha: 0.18 },
    { offset: 0.56, alpha: 0.05 },
    { offset: 1, alpha: 0 }
  ] as HeroBackdropStop[],
  mask: [
    { offset: 0, alpha: 1 },
    { offset: 0.52, alpha: 0.55 },
    { offset: 0.84, alpha: 0 }
  ] as HeroBackdropStop[]
}
