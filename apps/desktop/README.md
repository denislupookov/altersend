# AlterSend Desktop

Electron app for peer-to-peer file transfer on macOS, Windows, and Linux.

## Development

```sh
# From repo root
npm install
npm run dev
```

To run a second peer locally (for testing transfers between two instances):

```sh
npm run desktop:dev:peer2
# or
npm run desktop:dev:peer3
```

## Architecture

The desktop app has two processes:

**Main process** (`src/electron/`) — Node.js / Electron. Manages the app window, deep links, IPC bridge, and spawns the Bare worklet.

**Renderer process** (`src/renderer/`) — React + Vite. The UI. Communicates with main via a typed IPC bridge (`preload.cjs`).

**Bare worklet** (`packages/core/src/worklet/`) — a separate Bare (lightweight JS runtime) process that owns all P2P networking: Hyperswarm discovery, chunked file transfer, RPC protocol. Main talks to it over IPC; the worklet pushes events back.

```
Renderer ─── IPC (preload) ─── Main ─── IPC ─── Bare worklet
                                               (Hyperswarm / drive)
```

## Building installers

```sh
# macOS — arm64 and x64 are separate builds (no universal)
npm run dist:mac:arm64 -w apps/desktop
npm run dist:mac:x64   -w apps/desktop

# Windows — Squirrel (.exe) + MSIX
npm run dist:win:x64   -w apps/desktop
npm run dist:win:arm64 -w apps/desktop

# Linux — AppImage
npm run dist:linux:x64   -w apps/desktop
npm run dist:linux:arm64 -w apps/desktop
```

Installers land in `apps/desktop/out/`. For macOS local dev builds (no notarization), use `dist:mac:arm64:dev` / `dist:mac:x64:dev`.

## Code signing

- **macOS:** notarization is wired via `scripts/notarize.cjs` — requires `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` env vars, and a keychain profile named `notary`. See [Apple's notary tool docs](https://developer.apple.com/documentation/security/customizing-the-notarization-workflow).
- **Windows:** uses SignPath.io (free for verified OSS projects) via GitHub Actions. See [docs/SIGNING.md](../../docs/SIGNING.md).
- **Linux:** AppImage doesn't require signing.
