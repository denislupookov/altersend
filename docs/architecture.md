# Architecture

AlterSend is a monorepo with two apps (desktop, mobile) sharing four packages (core, domain, components, i18n). All P2P networking runs in a Bare worklet process, isolated from both the UI and the host runtime.

## Repository layout

```
apps/
  desktop/          Electron app (macOS, Windows, Linux)
  mobile/           React Native / Expo app (iOS, Android)
packages/
  core/             P2P protocol — Hyperswarm, Hyperdrive, RPC, transfer orchestration
  domain/           State management — Zustand store, reducers, business logic
  components/       Shared UI — React Strict DOM components, Tailwind tokens
  i18n/             Shared locale metadata, i18next setup, and catalogs
```

## Data flow

```
┌─────────────────────────────────────────────────────────────┐
│  App layer (desktop renderer / React Native)                │
│  - React UI, pages, user actions                            │
│  - Reads state from domain store (Zustand)                  │
│  - Dispatches commands via bindTransferApi()                │
└──────────────────────┬──────────────────────────────────────┘
                       │ commands / events (typed RPC)
┌──────────────────────▼──────────────────────────────────────┐
│  Domain layer  (packages/domain)                            │
│  - Zustand store + reducer                                  │
│  - Send / Receive page models                               │
│  - Format utilities, join-code logic                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ IPC / RPC bridge
┌──────────────────────▼──────────────────────────────────────┐
│  Core worklet  (packages/core)                              │
│  - Runs in a separate Bare process                          │
│  - TransferOrchestrator: owns lifecycle + session state     │
│  - Swarm: connect + replicate; Sender/Receiver: stage/write │
│  - RPC server: encodes events, decodes commands             │
└──────────────────────┬──────────────────────────────────────┘
                       │ Hyperswarm (DHT + noise encryption)
              Peer-to-peer network
```

## Packages

### `packages/core`

The protocol layer. Runs entirely inside a **Bare worklet** — a lightweight JS runtime (Bare) spawned by the host app. This isolates P2P networking from Electron / React Native.

Key modules:
- `worklet/index.ts` — entrypoint; wires Bare IPC → RPC server → orchestrator
- `worklet/transfer/orchestrator.ts` — top-level coordinator; owns session lifecycle + state and composes the three subsystems below
- `worklet/transfer/swarm.ts` — `TransferSwarm`: Hyperswarm peer connectivity, Corestore replication, and per-peer control channels
- `worklet/transfer/sender.ts` — `TransferSender`: stages local files into the writable Hyperdrive (sender path)
- `worklet/transfer/receiver.ts` — `TransferReceiver`: writes replicated remote Hyperdrive contents to disk (receiver path)
- `worklet/rpc/server.ts` — RPC server that bridges IPC to events/commands
- `worklet/rpc/protocol.ts` — canonical RPC command/reply types and encode/decode helpers
- `client/worker-client.ts` — typed client used by the host app to talk to the worklet

### `packages/domain`

State and business logic, shared across desktop and mobile.

Key modules:
- `transfer/store.ts` — Zustand store
- `transfer/reducer.ts` — pure reducer (all state transitions)
- `transfer/binding.ts` — `bindTransferApi()` wires the store to the core worklet
- `send/` / `receive/` — page-level view models and join-code logic

### `packages/components`

Shared React components using **React Strict DOM** (works on both web and native) and Tailwind for styling. Built with Storybook for visual development.

### `packages/locales`

Shared internationalization package used by desktop and mobile. It owns supported locale metadata, locale preference resolution, i18next initialization, and bundled translation catalogs. The app-facing language UI is currently release-gated by `isMultiLangEnabled = false`; while disabled, desktop and mobile hide language pickers and force the active locale to `en-US`. See [i18n.md](i18n.md) for catalog structure and translation workflow.

## Transfer flow

1. **Sender** enters the share screen → the core worklet generates a fresh, single-use swarm topic: a random 32-byte key, hex-encoded to a 64-char join code. Domain wraps it for display (QR / `com.altersend.mobile://join/<topic>` URL).
2. **Receiver** scans the QR or types the join code → domain validates and extracts the hex topic, then passes it to core.
3. Core worklet on both sides joins the Hyperswarm topic for that key. On each peer connection the shared Corestore replicates over the noise-encrypted socket.
4. Sender stages the selected files into its writable Hyperdrive, then broadcasts a `transfer-ready` control message carrying file offers (each with the drive key).
5. Receiver requests the offered files and downloads their blobs from the replicated drive. Progress and completion events flow back over the control channel → RPC → domain reducer → UI.

## IPC bridge (desktop)

```
Renderer → preload.cjs (contextBridge) → main process → Bare worklet IPC
Bare worklet → IPC → main process → preload.cjs → Renderer (events)
```

All IPC messages are typed via the protocol definitions in `packages/core/src/worklet/rpc/protocol.ts`.
