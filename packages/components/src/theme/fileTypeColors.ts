export type FileTypeColor = { fg: string; bg: string }

export const fileTypeColors = {
  image: { fg: '#68a0f5', bg: 'rgba(104, 160, 245, 0.18)' },
  video: { fg: '#ef8096', bg: 'rgba(239, 128, 150, 0.18)' },
  pdf: { fg: '#ec7d6f', bg: 'rgba(236, 125, 111, 0.18)' },
  audio: { fg: '#b78ae8', bg: 'rgba(183, 138, 232, 0.18)' },
  archive: { fg: '#e0b34e', bg: 'rgba(224, 179, 78, 0.18)' },
  app: { fg: '#c2c8d2', bg: 'rgba(194, 200, 210, 0.14)' },
  code: { fg: '#5fd3bf', bg: 'rgba(95, 211, 191, 0.18)' },
  generic: { fg: '#aeb6c4', bg: 'rgba(174, 182, 196, 0.14)' }
} as const satisfies Record<string, FileTypeColor>

export type FileTypeKey = keyof typeof fileTypeColors
