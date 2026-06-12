# CLI Architecture

This document describes the AlterSend CLI application.

## Overview

The CLI provides a terminal interface for AlterSend P2P file transfers, enabling send and receive operations without the GUI app.

## Design Rules

From CLAUDE.md:

- TypeScript everywhere — `strict: true` across all packages
- Prettier for formatting (config in `.prettierrc` at the repo root)
- ESLint must pass with `--max-warnings=0`
- Comments: default to none. Add one only when the *why* is non-obvious (a hidden constraint, a subtle invariant, a workaround). Don't explain what well-named code already says.
- Avoid stray `console.log` in committed code — `console.warn` / `console.error` are fine for legitimate error paths

## Architecture

Three-layer system (same as desktop/mobile):

```
CLI (Node.js process)
  │  paparam command parsing, console output
Domain (packages/domain)
  │  Zustand store + pure reducer, join-code logic
  │  bridges to worklet via RPC
Core worklet (packages/core)
     Bare process — Hyperswarm peer discovery, Hyperdrive file transfer
     TransferOrchestrator → TransferSwarm + TransferSender + TransferReceiver
```

The CLI spawns the Bare worklet directly via `pear-runtime` (same as desktop app), bypassing Electron entirely.

## CLI Commands

### send

Shares files with a receiver. Generates a join code (64-char hex topic) for the receiver to use.

```bash
altersend send <files>... [options]
altersend send ./file.zip ./image.png
altersend send ./video.mp4 --qr         # display QR code
altersend send ./file.zip --temp        # delete after transfer
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--qr` | Display QR code in terminal | off |
| `--temp` | Delete files after all peers download | false |

**Flow:**
1. Parse file paths from args
2. Call `host()` → get 64-char topic
3. Display join code (and QR if `--qr`)
4. Call `shareFiles()` with file list
5. Stream status events to console until transfer completes or interrupted

**Status output:**

| Event | CLI Output |
|-------|------------|
| `peer-connected` | `Peer connected (1 peer)` |
| `sharing` | `Sharing "filename"...` |
| `peer-download-progress` | `Peer downloading "filename" (45%)` |
| `peer-downloaded` | `Peer downloaded "filename"` |
| `peer-disconnected` | `Peer disconnected` |
| `disconnected` | `Transfer complete!` |

---

### receive

Joins a sender's session using a join code and downloads files.

```bash
altersend receive <join-code> [options]
altersend receive aabbccdd...                    # 64-char join code
altersend receive aabbccdd... --output ./downloads
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--output <dir>` | Download directory | `./altersend-downloads/` |

**Flow:**
1. Validate join code (64-char hex)
2. Call `join(topic)` to connect
3. Wait for file offers via events
4. Auto-download all offered files to output directory
5. Stream status events to console until transfer completes

**Status output:**

| Event | CLI Output |
|-------|------------|
| `joining` | `Connecting to peer...` |
| `joined` | `Connected! Waiting for files...` |
| `peer-connected` | `Peer connected (1 peer)` |
| `downloading` | `Downloading "filename"...` |
| `download-progress` | `Downloading "filename" (2.3MB / 5.1MB)` |
| `downloaded` | `Saved: ./downloads/filename` |
| `peer-disconnected` | `Peer disconnected` |
| `disconnected` | `Transfer complete!` |

---

### status

Shows current transfer state.

```bash
altersend status
```

---

### cancel

Aborts any in-progress transfer.

```bash
altersend cancel
```

---

### disconnect

Ends session gracefully (closes peers but preserves state).

```bash
altersend disconnect
```

---

### peek

Previews files offered by a sender without downloading.

```bash
altersend peek <join-code>
altersend peek aabbccdd...
```

**Flow:**
1. Validate and parse join code
2. Call `join(topic)`
3. Display incoming file offers (name, size)
4. Disconnect without downloading

---

### check-update

Checks for available updates without applying.

```bash
altersend check-update
```

**Flow:**
1. Boot the runtime (spawns worklet, triggers pear's update check)
2. Wait up to 5 seconds for pear's `updated` event
3. Print one of:
   - `Update available. Run 'altersend update' to apply.`
   - `Up to date (v1.2.0).`
4. Destroy runtime and exit

---

### update

Applies a staged update, then prompts for restart.

```bash
altersend update
```

**Flow:**
1. Boot the runtime
2. If `updater.updated` is already true → call `applyUpdate()` immediately
3. If not → wait up to 10 seconds for the `updated` event, then call `applyUpdate()`
4. Print `Update applied. Run 'altersend ...' again to use the new version.`
5. Destroy runtime and exit

If no update is available: `Already up to date (v1.2.0).`

---

## File Structure

```
apps/cli/
├── package.json              # dependencies: @altersend/core, paparam, qrcode, pear-runtime
├── tsconfig.json             # extends root tsconfig, strict: true
└── src/
    ├── index.ts              # main entry, paparam command registration
    ├── runtime.ts            # worklet spawning via pear-runtime
    ├── qr.ts                 # QR code terminal output helper
    └── commands/
        ├── send.ts           # send command implementation
        ├── receive.ts        # receive command implementation
        ├── status.ts         # status command
        ├── cancel.ts         # cancel command
        ├── disconnect.ts     # disconnect command
        ├── peek.ts           # peek command
        ├── check-update.ts   # check for updates
        └── update.ts         # apply staged update
```

## Dependencies

**Runtime dependencies:**
- `@altersend/core` — P2P protocol, TransferRPC interface
- `paparam` — CLI argument parsing (same as desktop app)
- `qrcode` — QR code generation for terminal display
- `pear-runtime` — spawns Bare worklet process
- `b4a` — binary/buffer utilities
- `which-runtime` — OS detection for storage paths

**Dev dependencies:**
- `@types/qrcode` — TypeScript types for qrcode
- `@types/node` — TypeScript types for Node.js built-ins
- `pear` — pear CLI (for `pear init` / `pear stage` / `pear release`)

**`bin` entry** (with shebang for Unix-like systems):

```json
{
  "bin": {
    "altersend": "./dist/index.js"
  }
}
```

The compiled `dist/index.js` must start with `#!/usr/bin/env node`. Add this as a post-build step or include it in the source file as the very first line:

```typescript
#!/usr/bin/env node

import { command, flag, sloppy } from 'paparam'
// ...
```

## Key Implementation Notes

### Worklet Spawning

The CLI uses `pear-runtime` directly (same as `apps/desktop/src/electron/runtime.ts`):

```typescript
import PearRuntime from 'pear-runtime'
import { createTransferWorkerClient } from '@altersend/core'

const pear = new PearRuntime({
  name: 'AlterSend',
  dir: storagePath,
  version: pkg.version,        // read from package.json
  upgrade: pkg.upgrade,        // read from package.json (pear:// link)
  updates: true                // OTA updates enabled
})

const worker = pear.run(workerPath, [`--storage=${pear.storage}`])
const client = createTransferWorkerClient(worker, {
  onEvent: (message) => handleEvent(message)
})
```

The upgrade link is read from `apps/cli/package.json#upgrade` via `createRequire`. The runtime throws immediately if the link contains `REPLACE_WITH` — see `docs/CLI_RELEASING.md` for how to mint a real link.

### Event Handling

Status events flow through `onEvent` callback:

```typescript
type RendererTransferEvent = StatusEvent | ErrorEvent | RoleEvent | PeerControlMessage

function handleEvent(event: RendererTransferEvent): void {
  switch (event.type) {
    case 'status':
      console.log(formatStatus(event.state, event))
      return
    case 'error':
      console.error('Error:', event.message)
      return
  }
}
```

### QR Code Display

Use `qrcode` package with terminal output:

```typescript
import QRCode from 'qrcode'

await QRCode.toString(topic, { type: 'terminal' })
```

### File Path Handling

Use utility functions from `packages/core`:

```typescript
import { getFileName, isPathSafe } from '@altersend/core'
import { formatFileSize } from '@altersend/domain'
```

### Keyboard Interrupt Handling

Handle SIGINT gracefully:

```typescript
process.on('SIGINT', async () => {
  await client.disconnect()
  process.exit(0)
})
```

## Constraints

- The worklet cannot use Node/browser APIs — only Bare modules
- CLI runs in Node.js, so normal Node APIs are fine for CLI code
- `disconnect()` wipes storage; `closePeers()` only closes connections
- `abortInFlight()` can interrupt in-progress transfers

## Build & Run

```bash
# Build
npm run cli:build

# Run
node apps/cli/dist/index.js send ./file.zip
node apps/cli/dist/index.js receive <join-code>
```

## Code Style & Lint

### Prettier

Uses root `.prettierrc` (no override needed):

```json
{
  "arrowParens": "always",
  "bracketSameLine": false,
  "bracketSpacing": true,
  "endOfLine": "lf",
  "jsxSingleQuote": true,
  "printWidth": 100,
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none"
}
```

### ESLint

The root `eslint.config.mjs` auto-runs on `apps/**` and `packages/**` — `apps/cli/**` is linted with no extra config.

Rules in effect:

- `typescript-eslint` recommended
- `unused-imports/no-unused-imports`: error
- `unused-imports/no-unused-vars`: warn (`_`-prefixed allowed)
- `no-restricted-syntax`: bans raw hex/rgb colors in template strings and literals

The color rule does not apply to the CLI since it has no UI, but the linter will still scan files. Use ANSI escape codes (e.g. `\u001b[31m`) for terminal colors, not hex/rgb literals.

### TypeScript

Root `tsconfig.json` enables `strict: true` (which includes `noUnusedLocals`, `noUnusedParameters`, `noImplicitAny`, `strictNullChecks`). The CLI's `tsconfig.json` extends the root with no override.

### Pre-commit Hook

Husky runs `lint-staged` on commit, which executes `eslint --max-warnings=0` on changed `.ts/.tsx/.js/.jsx` files in `apps/**` and `packages/**`. The CLI files are included automatically.

## Build Order

The CLI depends on `@altersend/core`. Per CLAUDE.md, packages must build in order: `core → domain → components → app`.

The CLI's `cli:build` script must run after `core` is built:

```json
{
  "scripts": {
    "cli:build": "npm run build -w packages/core && tsc -p apps/cli/tsconfig.json",
    "cli:dev": "npm run cli:build && node apps/cli/dist/index.js"
  }
}
```

## Storage Paths

The CLI uses `pear-runtime` to spawn the worklet, which requires a storage directory. Storage path resolution mirrors `apps/desktop/src/electron/runtime.ts`:

**Default storage location per OS:**

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/AlterSend` |
| Linux | `~/.config/AlterSend` |
| Windows | `%LOCALAPPDATA%/AlterSend` |

**Override with `--storage <path>`** (matches desktop's flag):

```bash
altersend send ./file.zip --storage ./my-storage
```

Use `path.join` (not string concatenation) for cross-platform compatibility. Use `which-runtime` (`isMac`, `isLinux`, `isWindows`) for OS detection, same as desktop.

## Input Validation

### Join Code Validation

Use `isValidJoinCode()` and `extractJoinCode()` from `@altersend/domain`:

```typescript
import { isValidJoinCode, extractJoinCode } from '@altersend/domain'

const code = extractJoinCode(userInput) // strips altersend:// prefix
if (!isValidJoinCode(code)) {
  console.error('Invalid join code. Must be 64 hex characters.')
  process.exit(2)
}
```

### File Path Validation

```typescript
import { isPathSafe } from '@altersend/core'

for (const path of files) {
  if (!isPathSafe(path)) {
    console.error(`Unsafe path: ${path}`)
    process.exit(2)
  }
  if (!fs.existsSync(path)) {
    console.error(`File not found: ${path}`)
    process.exit(2)
  }
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (worklet failure, network issue) |
| 2 | Invalid input (bad join code, missing file) |
| 3 | Worklet spawn failure |
| 4 | Transfer aborted by user |

## File Glob Handling

Support glob patterns in `send` so users can pass `*.pdf` style args:

```typescript
import { glob } from 'node:fs/promises' // Node 20+

const files: string[] = []
for (const arg of fileArgs) {
  if (arg.includes('*') || arg.includes('?')) {
    for await (const match of glob(arg)) {
      files.push(match)
    }
  } else {
    files.push(path.resolve(arg))
  }
}
```

Resolve relative paths with `path.resolve()` before passing to the worklet.

## TTY Detection

The QR code uses Unicode block characters. Detect TTY before rendering:

```typescript
import QRCode from 'qrcode'

async function displayQR(topic: string): Promise<void> {
  if (process.stdout.isTTY) {
    const qr = await QRCode.toString(topic, { type: 'terminal' })
    console.log(qr)
  } else {
    console.log(`Join code: ${topic}`)
    console.log('(QR code suppressed — non-TTY environment)')
  }
}
```

## Testing Strategy

Use **vitest** (same as rest of repo). Each package has its own `vitest.config.ts`:

```typescript
// apps/cli/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts']
  }
})
```

Add to `apps/cli/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^4.1.8"
  }
}
```

Test files live alongside source and follow the same pattern as `packages/domain` and `packages/core` (no test infrastructure in `apps/desktop` or `apps/mobile` exists yet — only `packages/*` have tests).

**Pure function tests** (no mocking needed):

```
apps/cli/src/commands/args.test.ts        # paparam arg parsing
apps/cli/src/format.test.ts               # CLI-specific formatting helpers
```

**Mocked integration tests** (mock `WorkerClient` to avoid spawning worklet):

```
apps/cli/src/commands/send.test.ts        # send flow
apps/cli/src/commands/receive.test.ts     # receive flow
apps/cli/src/commands/peek.test.ts        # peek flow
```

Mock pattern:

```typescript
import { describe, expect, it, vi } from 'vitest'
import type { WorkerClient } from '@altersend/core'

function mockClient(): WorkerClient {
  return {
    ready: Promise.resolve(),
    host: vi.fn().mockResolvedValue({ topic: 'a'.repeat(64) }),
    join: vi.fn().mockResolvedValue({ state: 'joined' }),
    shareFiles: vi.fn().mockResolvedValue({ acceptedFiles: 1 }),
    downloadFiles: vi.fn().mockResolvedValue({ files: [] }),
    disconnect: vi.fn().mockResolvedValue({ state: 'disconnected' }),
    closePeers: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn()
  } as unknown as WorkerClient
}

describe('send', () => {
  it('calls host() and shareFiles() with resolved file paths', async () => {
    const client = mockClient()
    await runSend({ client, files: ['./test.txt'], output: '.' })
    expect(client.host).toHaveBeenCalledOnce()
    expect(client.shareFiles).toHaveBeenCalledWith([{ path: 'C:/abs/test.txt' }])
  })
})
```

Run with:

```bash
npm test -w apps/cli              # single package
npx vitest run apps/cli           # direct
```

## Package.json Updates (root)

The root `package.json` requires two updates:

**1. Add `apps/cli` to `workspaces`:**

```json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

`apps/*` already covers it, so no change is needed here.

**2. Add scripts:**

```json
{
  "scripts": {
    "cli:build": "npm run build -w packages/core && tsc -p apps/cli/tsconfig.json",
    "cli:dev": "npm run cli:build && node apps/cli/dist/index.js",
    "cli:test": "vitest run apps/cli"
  }
}
```

## CLAUDE.md Update

Add the CLI commands to the Commands section of `CLAUDE.md`:

```markdown
# CLI
npm run cli:build          # build CLI (requires packages/core built first)
npm run cli:dev            # build and run CLI
npm run cli:test           # run CLI tests
```

## Sentry Exclusion

Per CLAUDE.md, the Bare worklet has no Sentry. The CLI itself also does not include Sentry. No `EXPO_PUBLIC_SENTRY_DSN`, `VITE_SENTRY_DSN`, or `SENTRY_DSN` env vars are needed.