# Architecture

AlterSend is a monorepo with two apps (desktop, mobile) sharing five packages (core, drive, domain, components, locales). All P2P networking runs in a Bare worklet process, isolated from both the UI and the host runtime.

## Repository layout

```
apps/
  desktop/          Electron app (macOS, Windows, Linux)
  mobile/           React Native / Expo app (iOS, Android)
packages/
  core/             P2P protocol — Hyperswarm, transfer orchestration, device pairing, RPC
  drive/            Chunked file transfer — fixed chunks, pread/pwrite, resume
  domain/           State management — Zustand store, reducers, business logic
  components/       Shared UI — React Strict DOM components, Tailwind tokens
  locales/          Shared locale metadata, i18next setup, and catalogs
```

## Data flow

```
┌─────────────────────────────────────────────────────────────┐
│  App layer (desktop renderer / React Native)                │
│  React UI + pages; reads domain store; dispatches commands  │
└──────────────────────┬──────────────────────────────────────┘
                       │ typed RPC (commands / events)
┌──────────────────────▼──────────────────────────────────────┐
│  Domain layer  (packages/domain)                            │
│  Zustand store + reducer; send/receive view models          │
└──────────────────────┬──────────────────────────────────────┘
                       │ IPC / RPC bridge
┌──────────────────────▼──────────────────────────────────────┐
│  Core worklet  (packages/core) — separate Bare process      │
│  TransferOrchestrator (lifecycle + state); swarm; RPC server│
└──────────────────────┬──────────────────────────────────────┘
                       │ Hyperswarm (DHT + noise encryption)
              Peer-to-peer network
```

## Packages

### `packages/core`

The protocol layer, running entirely inside a **Bare worklet** (a lightweight JS runtime spawned by the host) so P2P networking is isolated from Electron / React Native.

- `worklet/index.ts` — entrypoint; wires Bare IPC → RPC server → orchestrator
- `worklet/transfer/orchestrator.ts` — top-level coordinator; owns session lifecycle + state, composes the subsystems below
- `worklet/transfer/swarm.ts` — `TransferSwarm`: peer connectivity, per-peer control channels
- `worklet/transfer/drive.ts` — the `@altersend/drive` chunk channel over Protomux; the only transfer path
- `worklet/transfer/control-channel.ts` — per-peer control messages (offers, requests, progress, cancel)
- `worklet/transfer/sender.ts` / `receiver.ts` — sender describes files on disk and serves chunks from them; receiver opens a drive channel per file and writes chunks straight to the target
- `worklet/transfer/topic-auth.ts` — the join-code proof (see [Topic authentication](#topic-authentication))
- `worklet/relay/config.ts` / `conf.ts` — relay state + `relayThrough`; relay list from a signed DHT record (see [Relay fallback](#relay-fallback))
- `worklet/relay/announce.ts` / `upgradeWebRelay.ts` — present a signed cap token to a relay (see [Relay fallback](#relay-fallback))
- `worklet/identity/device-identity-store.ts` — the stable device keypair, sealed in the OS keychain (see [Pairing](#remembered-devices--pairing))
- `worklet/peers/*` — `RememberedPeerStore`, `PairingCoordinator`, `DiscoveryCoordinator`, `RecognitionCoordinator`, `RememberCoordinator`
- `worklet/rpc/*` — RPC server + canonical command/reply protocol; `client/worker-client.ts` is the host-side typed client

### `packages/drive`

The chunked file-transfer engine, independent of Hyperswarm and Hyperdrive. The sender `pread`s fixed-size chunks and the receiver `pwrite`s them at their offset, so neither side keeps a second copy on disk; a resume bitmap picks up an interrupted transfer where it stopped.

It runs over a caller-supplied `DriveChannel` rather than owning a socket (core supplies a Protomux channel today), so it stays transport-agnostic. `DiskReader` / `DiskWriter` are the Bare adapters; the root export is fs-free so the engine also runs in a browser. Wire protocol: `packages/drive/README.md`.

### `packages/domain`

State and business logic, shared across desktop and mobile.

- `transfer/store.ts` — Zustand store
- `transfer/reducer.ts` — pure reducer (all state transitions)
- `transfer/binding.ts` — `bindTransferApi()` wires the store to the core worklet
- `send/` / `receive/` — page view models and join-code logic

### `packages/components`

Shared React components in **React Strict DOM** (web + native) with Tailwind tokens; developed in Storybook.

### `packages/locales`

Locale metadata, preference resolution, i18next setup, and bundled catalogs for 13 locales. The active locale resolves from the user's preference, then system locale, then `en-US`. See [i18n.md](i18n.md).

## Transfer flow

1. **Sender** opens the share screen → the worklet generates a single-use topic: a random 32-byte key, hex-encoded to a 64-char join code, displayed as QR / `com.altersend.mobile://join/<topic>`.
2. **Receiver** scans or types the code → domain validates and extracts the topic, passes it to core.
3. Both sides join the Hyperswarm topic; on connection they open control and drive channels over the noise-encrypted socket.
4. **Topic authentication** — the sender challenges the receiver to prove it holds the join code before releasing any offers; a wrong proof is rejected, while a peer that never proves it is flagged (not dropped). See [Topic authentication](#topic-authentication).
5. Sender broadcasts a `transfer-ready` message with file offers.
6. Receiver requests each file over a `@altersend/drive` chunk channel, streaming chunks straight to disk. Progress flows back over the control channel → RPC → domain → UI.

A peer that does not speak the drive protocol (AlterSend 1.6 or older) fails the download with an "update AlterSend" message. New transfer work belongs in `packages/drive`.

A transfer is capped at **10,000 files** (`MAX_FILES_PER_TRANSFER`, validated in `control-validation.ts`); the send UI blocks earlier with a "zip them" hint. The whole offer list goes in one message on the single worklet thread, so huge counts would choke it.

## Topic authentication

The DHT **discovery topic** is only a hash — observable on the network, and (for the browser receiver) also routed through the public [hyperswarm-dht-relay](https://github.com/holepunchto/hyperswarm-dht-relay). Knowing it must not be enough to receive files; a peer has to prove it holds the actual **join code**.

The sender sends a random `challenge` nonce; the receiver must reply with `topicProof(joinCode, nonce)` — a BLAKE2b hash of the code + nonce (`worklet/transfer/topic-auth.ts`). The join code never crosses the wire.

A valid proof releases the offers (even if late) and is required to serve a file — `serve()` refuses a download request from an unauthenticated peer, so reaching the topic is not enough even if a file id leaks. A wrong proof drops the connection. A peer silent past 10 s isn't dropped — it's flagged **"Update to connect"** (`peer-unauthenticated`) and can still auth late (`peer-authenticated` clears it), so a busy sender never aborts a legit receiver. Receiving from an older sender is unaffected — a receiver only answers a challenge, never requires one.

## Relay fallback

Most transfers connect directly via hole-punching. When two peers can't reach each other — typically both behind symmetric NAT (e.g. both on a VPN) — the transfer falls back to a **blind relay**: a public server that pairs the peers and forwards their already-encrypted UDX stream, never holding the keys to decrypt it.

- **Engagement** — `relay/config.ts` exposes `relayThrough` in "eager" mode: when enabled it always offers the relay, so hyperdht races a relayed path against a direct punch and upgrades to direct if the punch lands.
- **Discovery** — the relay key isn't baked in. `relay/conf.ts` reads the relay list from a signed DHT **mutable record** (public key injected at build via `--relay-conf-pubkey`), so relays rotate with no app release. Fetched lazily once the relay is enabled, with bounded retry (the worklet keeps no persistent core storage, so a hypercore won't do).
- **Classification** — `TransferSwarm.classifyConnection` matches a peer's `remoteHost` against known relay hosts and emits a per-peer `connection-type` (`direct` / `relay`), keyed per sender; the UI shows **Connected** vs **Connected via relay**.
- **Caps** — a relay caps how much a session forwards. A sender raises its own cap with a short-lived token signed by the entitlement service and verified against the relay's public key: `relay/announce.ts` sends it over a protomux `altersend-pro` channel, and `config.ts` releases it only while sending and only to a key from the signed relay list. A browser receiver asks its sender for the upgrade via the `web-relay` control message; `upgradeWebRelay.ts` dials the relay to announce it. Enforced relay-side.

The app is only ever a relay _client_ — it holds the relay's public key and address, never a secret.

## Browser receiver

`apps/web` is a receive-only client that runs in a plain browser — no install. It reuses the same transfer engine (`@altersend/drive` over Protomux) and the [topic-authentication](#topic-authentication) handshake; the only thing that differs is how it reaches the DHT.

A browser can't speak the UDP-based DHT directly, so it tunnels DHT operations over a WebSocket to a **hyperswarm-dht-relay**. The relay is **non-custodial** (`{ custodial: false }`): the browser generates and keeps its own keypair, so the relay only proxies traffic and the peer connection stays Noise-encrypted end to end — the relay is blind to content, exactly like the native blind relay.

Two dht-relays are available — **Frankfurt** (`relay.altersend.com`) and **Singapore** (`relay-sg.altersend.com`). On startup the client opens a socket to both and keeps whichever connects first (`fastestRelay`), falling back to the other if one is down. From there it looks up the sender's discovery key, connects, authenticates, and streams chunks into a browser download sink (`apps/web/src/transfer/relay.ts`). Relay hosts can be overridden in dev with `VITE_RELAY_URL`.

## Remembered devices & pairing

You can **pair** devices you trust to send to them later without a code. This lives in the worklet (`peers/*` + `identity/`) across three Hyperswarm instances:

| Swarm                                  | Lifetime        | Transport key           | Purpose                                          |
| -------------------------------------- | --------------- | ----------------------- | ------------------------------------------------ |
| **Transfer** (`TransferSwarm`)         | per session     | fresh per-topic keypair | the file transfer (join-code flow above)         |
| **Pairing** (`PairingCoordinator`)     | per app session | per-topic keypair       | the QR / code pairing handshake                  |
| **Discovery** (`DiscoveryCoordinator`) | persistent      | the **device keypair**  | background links to remembered devices + invites |

- **Device identity** — each install has a stable Ed25519 keypair (`DeviceIdentityStore`); the secret is sealed in the OS keychain (desktop `safeStorage`, mobile `expo-secure-store`) and injected at startup, only the public key persists.
- **Pairing** — the QR opens a pairing swarm on a fresh topic; both sides exchange a signed `pairing-info` (pubkey + name, signed over the noise handshake so it can't be relayed) and vote to remember each other, deriving a shared rendezvous topic. A live transfer peer can pair via the "Pair" button (`RememberCoordinator`).
- **Discovery & invites** — the discovery swarm uses the device keypair, firewalled to remembered pubkeys, keeping background links to paired devices. To send without a code you "invite" one: the worklet joins its rendezvous topic and sends an invite it can accept.
- **Recognition (privacy)** — to badge an already-paired peer without revealing identity, each side sends only a **signature** over the handshake (no pubkey/name); the receiver matches it against its own remembered devices. A non-paired peer learns nothing.
- **Persistence** — a transfer keeps nothing on disk beyond the file being written; device identity and the remembered-peer list persist.

## IPC bridge (desktop)

```
Renderer → preload.cjs (contextBridge) → main process → Bare worklet IPC
Bare worklet → IPC → main process → preload.cjs → Renderer (events)
```

All IPC messages are typed via `packages/core/src/worklet/rpc/protocol.ts`.
