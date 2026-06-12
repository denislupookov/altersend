# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
# Dev
npm run dev                    # desktop (builds packages then starts Electron)
npm run mobile:start           # mobile Metro bundler (Expo dev client)
npm run mobile                 # build packages + launch iOS simulator

# Test (run from root or individual package)
npm test                       # all packages
npm test -w packages/core      # single package
npx vitest run src/foo.test.ts # single file (inside packages/core or domain)

# Lint / typecheck
npm run lint                   # ESLint across all apps + packages (max-warnings=0)
npm run check:tokens           # fails if any raw hex/rgb color bypasses the token system
npm run components:typecheck   # typecheck components package

# Build
npm run desktop:build          # full desktop build (packages + Electron)
npm run components:build       # packages/components only
npm run components:storybook   # Storybook on port 6100

# Multi-peer local testing (separate Electron instances sharing same machine)
npm run desktop:dev:peer2
npm run desktop:dev:peer3
```

Packages **must build in order**: `core` → `domain` → `components` → app. The top-level `npm run dev` / `desktop:build` scripts handle this automatically.

## Architecture

Three-layer system: **App** → **Domain** → **Core worklet** (separate process).

```
App (renderer / React Native)
  │  reads Zustand state, dispatches commands via bindTransferApi()
Domain (packages/domain)
  │  Zustand store + pure reducer, page view-models, join-code logic
  │  bridges to worklet via IPC/RPC
Core worklet (packages/core)
     Bare process — Hyperswarm peer discovery, Hyperdrive file transfer
     TransferOrchestrator → TransferSwarm + TransferSender + TransferReceiver
```

### packages/core

Runs in a **Bare worklet** — a separate `bare-process` spawned by the host app, not in Electron's main/renderer or React Native's JS thread. The worklet has no DOM, no Node APIs — only Bare-flavored modules (`bare-fs`, `bare-process`).

- `worklet/index.ts` — entrypoint; wires Bare IPC → RPC server → orchestrator
- `worklet/transfer/orchestrator.ts` — top-level coordinator implementing `TransferRPC`; composes `TransferSwarm`, `TransferSender`, `TransferReceiver`
- `worklet/rpc/protocol.ts` — canonical RPC types and encode/decode helpers
- `worklet/rpc/server.ts` — RPC server; queues commands, emits events back to renderer
- `client/worker-client.ts` — typed Proxy used by the host to call worklet methods

The worklet **wipes its Corestore on every startup and disconnect** — Hyperdrive state is ephemeral in v1.

### packages/domain

State and business logic shared across desktop and mobile.

- `transfer/store.ts` — module-scope Zustand store (lives outside React tree)
- `transfer/reducer.ts` — pure reducer; all state transitions go here
- `transfer/binding.ts` — `bindTransferApi()` wires the store to the worklet client
- `send/` / `receive/` — page-level view-models and join-code encoding/decoding

### packages/components

Shared UI built with **React Strict DOM** (renders on both web and RN) and Tailwind. The token system is the canonical source of colors — see below.

### Desktop app (apps/desktop)

- `src/electron/main.ts` — app entry; creates `DesktopRuntime`, registers IPC handlers
- `src/electron/runtime.ts` — spawns the Bare worklet via `pear-runtime`, manages worker lifecycle
- `src/electron/ipc.ts` — all `ipcMain.handle` registrations
- `src/electron/preload.cjs` — `contextBridge` between renderer and main
- `src/renderer/api/bridgeApi.ts` — typed wrapper around `window.bridge` for renderer use

IPC chain: `Renderer → contextBridge → ipcMain → Bare worklet IPC → orchestrator`

### Mobile app (apps/mobile)

The Bare worklet bundle is compiled separately before each run (`bare-pack`). `npm run mobile:start` preruns `bundle-bare` automatically. On first setup run `npm run mobile:setup` (iOS) which also installs CocoaPods.

## Design token system

**Raw color literals are banned** in `apps/**` and `packages/components/**`.

- ESLint (`npm run lint`) and `npm run check:tokens` both enforce this.
- Use Tailwind utilities (`bg-success`, `border-info`), StyleX tokens (`tokens.colorXxx`), or `theme.colors.colorXxx` for RN inline styles.
- For opacity variants: `withAlpha(token, alpha)` (RN) or Tailwind opacity utilities (`bg-success/12`).
- The only allowed exceptions are files under `packages/components/src/theme/` — that is the source of truth.

## Key constraints

- The worklet cannot import Node or browser APIs — only Bare modules.
- Storage passed via `--storage=` arg to the worklet; on desktop this resolves via `PearRuntime`. Mobile uses a different path for identity vs cache storage because iOS can evict the cache dir.
- `disconnect()` does a full storage wipe and reinit; `closePeers()` only tears down the swarm and preserves state.
- `abortInFlight()` is intentionally callable outside the RPC queue so a disconnect command can interrupt an in-progress transfer ahead of it in the queue.
