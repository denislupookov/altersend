export const API = {
  methods: {
    host: 1,
    join: 2,
    shareFiles: 3,
    downloadFiles: 4,
    disconnect: 5,
    closePeers: 6
  },
  channels: {
    event: 100,
    log: 101
  }
} as const

export const API_BY_VALUE = Object.fromEntries(
  Object.entries(API.methods).map(([k, v]) => [v, k])
) as Record<number, keyof typeof API.methods>

export type TransferMethod = keyof typeof API.methods
