# Architecture

AlterSend is a monorepo with two apps (desktop, mobile) sharing four packages (core, domain, components, i18n). All P2P networking runs in a Bare worklet process, isolated from both the UI and the host runtime.

## Repository layout

```
apps/
  desktop/          Electron app (macOS, Windows, Linux)
  mobile/           React Native / Expo app (iOS, Android)
packages/
  core/             P2P protocol — Hyperswarm/Hyperdrive transfers, device pairing, RPC
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
- `worklet/transfer/orchestrator.ts` — top-level coordinator, owns session lifecycle + state and composes the transfer and remembered-device subsystems below
- `worklet/transfer/swarm.ts` — `TransferSwarm`: Hyperswarm peer connectivity, Corestore replication, and per-peer control channels
- `worklet/transfer/storage.ts` — `TransferStorage`: the ephemeral Corestore + Hyperdrive backing a session, plus the sender/receiver bound to them (wiped on every disconnect)
- `worklet/transfer/sender.ts` — `TransferSender`: stages local files into the writable Hyperdrive (sender path)
- `worklet/transfer/receiver.ts` — `TransferReceiver`: writes replicated remote Hyperdrive contents to disk (receiver path)
- `worklet/identity/device-identity-store.ts` — `DeviceIdentityStore`: the stable device keypair, its secret is sealed in the OS keychain and injected at startup (see [Remembered devices & pairing](#remembered-devices--pairing))
- `worklet/peers/store.ts` — `RememberedPeerStore`: persistent (HyperDB) list of paired devices
- `worklet/peers/pairing-coordinator.ts` — `PairingCoordinator`: the dedicated pairing swarm + QR / code pairing handshake
- `worklet/peers/discovery.ts` — `DiscoveryCoordinator`: background swarm to remembered devices (firewalled to known device keys) + code-free invites
- `worklet/peers/recognition-coordinator.ts` — `RecognitionCoordinator`: recognizes an already-paired peer during a transfer without revealing identity to anyone else
- `worklet/peers/remember-coordinator.ts` — `RememberCoordinator`: the pair-during-transfer vote handshake
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

Shared internationalization package used by desktop and mobile. It owns supported locale metadata, locale preference resolution, i18next initialization, and bundled translation catalogs. Desktop and mobile let users pick from 12 supported locales; the active locale resolves from the user's preference, falling back to the system locale and then `en-US`. See [i18n.md](i18n.md) for catalog structure and translation workflow.

## Transfer flow

1. **Sender** enters the share screen → the core worklet generates a fresh, single-use swarm topic: a random 32-byte key, hex-encoded to a 64-char join code. Domain wraps it for display (QR / `com.altersend.mobile://join/<topic>` URL).
2. **Receiver** scans the QR or types the join code → domain validates and extracts the hex topic, then passes it to core.
3. Core worklet on both sides joins the Hyperswarm topic for that key. On each peer connection the shared Corestore replicates over the noise-encrypted socket.
4. Sender stages the selected files into its writable Hyperdrive, then broadcasts a `transfer-ready` control message carrying file offers (each with the drive key).
5. Receiver requests the offered files and downloads their blobs from the replicated drive. Progress and completion events flow back over the control channel → RPC → domain reducer → UI.

## Remembered devices & pairing

Beyond one-off code transfers, you can **pair** devices you own (or trust) so you can send to them later without a code. This lives entirely in the worklet (`packages/core/src/worklet/peers/*` + `identity/`) and is backed by three separate Hyperswarm instances:

| Swarm                                  | Lifetime                       | Transport key           | Purpose                                                          |
| -------------------------------------- | ------------------------------ | ----------------------- | ---------------------------------------------------------------- |
| **Transfer** (`TransferSwarm`)         | per session                    | fresh per-topic keypair | the actual file transfer (the join-code flow above)              |
| **Pairing** (`PairingCoordinator`)     | persistent for the app session | per-topic keypair       | the QR / code pairing handshake                                  |
| **Discovery** (`DiscoveryCoordinator`) | persistent                     | the **device keypair**  | background connections to remembered devices + code-free invites |

**Device identity.** Each install has a stable Ed25519 device keypair (`DeviceIdentityStore`). The secret never sits in plaintext on disk — the host seals it in the OS keychain (desktop `safeStorage`, mobile `expo-secure-store`) and injects it into the worklet at startup; only the public key + metadata are persisted.

**Pairing.** Showing the QR opens the pairing swarm on a fresh topic (encoded in the QR). Both sides exchange a signed `pairing-info` (device pubkey + display name, signed over the connection's noise handshake so it can't be relayed) and vote to remember each other. On a mutual `remember`, each persists the other in its `RememberedPeerStore` and derives a shared **rendezvous topic** from both device keys + the handshake hash. An in-progress transfer peer can also be paired from the "Pair" button — the same vote handshake, via `RememberCoordinator`.

**Discovery & invites.** The discovery swarm uses the device keypair as its transport identity and a firewall that admits only remembered device pubkeys, so it keeps authenticated background connections to your paired devices on their rendezvous topics. To send without a code you "invite" a remembered device: the worklet joins that peer's rendezvous topic, waits for the connection, and sends an invite the peer can accept to join your transfer.

**Recognition (privacy).** A plain transfer uses a fresh per-topic key, so a counterparty never sees your stable identity. To still badge an _already-paired_ peer during a transfer, each side sends only a **signature** over the connection handshake (no pubkey, no name); the receiver matches it against its own remembered devices (`RecognitionCoordinator`). A non-paired peer receives an unattributable signature and learns nothing — full identity is exchanged only during explicit pairing.

**Persistence.** The transfer Corestore/Hyperdrive is wiped on every disconnect (transfers are ephemeral), but the device identity and remembered-peer list persist across sessions.

## IPC bridge (desktop)

```
Renderer → preload.cjs (contextBridge) → main process → Bare worklet IPC
Bare worklet → IPC → main process → preload.cjs → Renderer (events)
```

All IPC messages are typed via the protocol definitions in `packages/core/src/worklet/rpc/protocol.ts`.
