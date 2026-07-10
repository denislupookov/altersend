export const API = {
  methods: {
    host: 1,
    join: 2,
    shareFiles: 3,
    downloadFiles: 4,
    disconnect: 5,
    closePeers: 6,
    rememberVote: 7,
    peersList: 8,
    inviteDevice: 9,
    respondToInvite: 10,
    forgetPeer: 11,
    initDeviceSecret: 12,
    hostPairing: 13,
    joinPairing: 14,
    setRelayConfig: 15
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
