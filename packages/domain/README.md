# @altersend/domain

State management for AlterSend's P2P file transfer flow. Translates worklet events into a typed Zustand store and exposes commands the UI calls directly.

Used by both the mobile and desktop apps so they share one source of truth for transfer state.

## Install

```sh
npm install @altersend/domain
```

Peer dependencies (you must install these in your app):

```sh
npm install react zustand
```

## Quick start

At app entry — once, before any component mounts:

```ts
import { bindTransferApi } from '@altersend/domain'
import { mobileApi } from './api' // your platform's TransferApi implementation

bindTransferApi(mobileApi, {
  onError: (context, err) => Sentry.captureException(err, { tags: { context } })
})
```

In a component:

```tsx
import { useTransferStore, joinSession, clearSession } from '@altersend/domain'

function ReceiveButton() {
  const role = useTransferStore((s) => s.role)
  const peerCount = useTransferStore((s) => s.peerCount)

  if (role === 'receiver') {
    return <button onClick={clearSession}>End session</button>
  }
  return <button onClick={() => joinSession('topic-key')}>Join</button>
}
```

## Architecture

```
worklet events ──► bindTransferApi ──► reducer ──► store
                                                     │
                                                     ▼
                                              useTransferStore
                                                     ▲
UI ────────────► commands ──► dispatchToTransferStore
                     │
                     └──► worker RPC (worklet)
```

- **store** holds `TransferSessionState` — one source of truth.
- **reducer** is a pure `(state, action) → state` function. No side effects.
- **commands** are imperative functions UI calls. They dispatch state changes and proxy worker RPCs.
- **binding** is the worklet adapter — installs event subscriptions, wires `bindTransferApi`.
- **effects** are module-level subscribers (peer watchdog, background reconnect).

## Public API

**Setup**

- `bindTransferApi(api, options?)` — wire the platform `TransferApi` into the store.
- `TransferApi` — the interface mobile/desktop implement.
- `BindTransferApiOptions` — `{ onError?: (context, error) => void }`.

**State**

- `useTransferStore(selector)` — React hook.
- `transferStore` — module-level store (use `.getState()` / `.subscribe()`).
- `dispatchToTransferStore(action)` — dispatch a `TransferAction`.
- `TransferSessionState`, `TransferAction`, `TransferRole` — types.

**Commands**

- `joinSession(topic)` / `startSendSession()` / `clearSession()`
- `shareFiles(paths)` / `downloadFiles(files)`
- `addSelectedFiles(files)` / `removeSelectedFile(path)` / `continueShare(files)` / `clearSenderFlow()`

**Remembered devices (pairing)**

- `hostPairingSession()` / `joinPairingSession(topic)` — pair via QR / code
- `requestPair(transferId, peerKey)` / `rememberVote(input)` — pair a connected peer
- `inviteDevice(input)` / `respondToInvite(input)` — code-free invites to remembered devices
- `loadPeers()` / `forgetPeer(pubkey)` — list / remove remembered devices
- `usePairingSession(options)` — React hook driving the pairing & devices UI

**Effects** (mobile-only setup)

- `startPeerWatchdog()` — fires `peer_unreachable` after a connection grace period.
- `startBackgroundReconnectEffect()` — marks `reconnecting` when the app backgrounds mid-receive.
- `setAppActive(active)` — drive from `AppState` (mobile). Desktop ignores it.

**Receive-specific helpers**

- `getOfferKey`, `getStatusCopy`, `getDownloadTotals`, `createSingleDownloadRequest`, `createDirectoryDownloadRequests`, `applyDownloadRouted`.

**Send-specific helpers**

- `getSendStep`, `getSendPageCopy`, `getStatusLabel`, `getStatusTone`, `getProgressState`, `normalizeSelectedFiles`.

**Generic utilities**

- `formatFileSize`, `getParentDir`, `shortenHomePath`.

## Error handling

`bindTransferApi` accepts an optional `onError` callback. It receives every error that bubbles out of a command catch block or the boot RPC, with a stable `context` string identifying the call site:

```ts
bindTransferApi(api, {
  onError: (context, error) => {
    // context: "clearSession" | "joinSession" | "shareFiles" |
    //          "downloadFiles" | "startSendSession" | "bindTransferApi.startP2P"
    Sentry.captureException(error, { tags: { context } })
  }
})
```

Without `onError`, errors fall back to `console.error`. The store still receives the corresponding `set_error` / `join_failed` / `boot_failed` action either way — so the UI's error banner keeps working regardless of the integration.

## License

Apache-2.0
