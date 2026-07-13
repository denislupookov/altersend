# AlterSend CLI

P2P file transfer CLI — no GUI required.

## Installation

```bash
# Build from source (dev)
npm run build -w packages/core && npm run build -w apps/cli
node apps/cli/dist/index.js send ./file.zip

# Install globally for local testing
cd apps/cli && npm link
altersend send ./file.zip  # works from any directory

# For users (once published to npm)
npm install -g @altersend/cli
```

## Commands

### send

Share files with a receiver.

```bash
altersend send <files>... [options]
altersend send ./file.zip ./image.png
altersend send ./video.mp4 --qr         # display QR code
altersend send ./file.zip --temp        # delete after transfer
```

| Flag | Description |
|------|-------------|
| `--qr` | Show QR code for receiver |
| `--temp` | Delete files after transfer |
| `--storage <path>` | Custom storage path |
| `--no-updates` | Skip OTA update checks |

**Flow:** Parse files → host() → display join code → shareFiles() → stream events until done

---

### receive

Download files from a sender.

```bash
altersend receive <join-code> [options]
altersend receive aabbccdd...                    # 64-char join code
altersend receive aabbccdd... --output ./downloads
```

| Flag | Description | Default |
|------|-------------|---------|
| `--output <dir>` | Download directory | `./altersend-downloads/` |
| `--storage <path>` | Custom storage path | — |
| `--no-updates` | Skip OTA update checks | — |

**Flow:** Validate join code → join(topic) → wait for offers → auto-download all → disconnect

---

### peek

Preview file offers without downloading.

```bash
altersend peek <join-code>
```

Displays offered files then disconnects.

---

### check-update

Check for available CLI updates.

```bash
altersend check-update
```

Exits with message: `Update available. Run 'altersend update' to apply.` or `Up to date (vX.X.X).`

---

### update

Apply a staged update.

```bash
altersend update
```

After applying: `Update applied. Run 'altersend ...' again to use the new version.`

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (worklet failure, network issue) |
| 2 | Invalid input (bad join code, missing file) |

---

## Architecture

```
CLI (Node.js)
  │  paparam command parsing, console output
Core worklet (Bare process)
     Hyperswarm peer discovery, Hyperdrive file transfer
     TransferOrchestrator → TransferSwarm + TransferSender + TransferReceiver
```

The CLI spawns the Bare worklet via `pear-runtime` — same as desktop app, no Electron needed.

---

## File Structure

```
apps/cli/
├── package.json              # pear-runtime, paparam, qrcode, @altersend/core
├── tsconfig.json             # strict: true, extends root tsconfig
├── vitest.config.ts          # test setup
├── README.md                 # this file
└── src/
    ├── index.ts              # main entry, paparam command registration
    ├── runtime.ts            # worklet spawning via pear-runtime
    ├── qr.ts                 # QR code terminal output
    ├── progress.ts           # progress bar with width detection
    ├── joinCode.ts           # join code validation
    └── commands/
        ├── send.ts           # send command
        ├── receive.ts        # receive command
        ├── peek.ts           # peek command
        ├── check-update.ts   # check for updates
        └── update.ts         # apply staged update
```

---

## Storage Paths

Default storage per OS:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/AlterSend` |
| Linux | `~/.config/AlterSend` |
| Windows | `%LOCALAPPDATA%\AlterSend` |

Override with `--storage <path>`. If the default storage is locked (another instance running), the CLI auto-uses a temp directory instead.

---

## Design Rules

- TypeScript `strict: true`
- ESLint `--max-warnings=0`
- No raw color literals (ANSI escapes fine for CLI)
- No unnecessary comments — code explains itself
- Build order: `packages/core` → `apps/cli`

---

## Releasing (for maintainers)

The CLI ships via [pear](https://pear.software) — same infrastructure as desktop app.

### One-time setup

```bash
# Mint a pear link
npx pear init
# Output: pear://<64-hex-chars>
```

Paste the link into `apps/cli/package.json#upgrade`, then rebuild.

### Release a new version

```bash
# Build
npm run cli:build

# Package
mkdir -p /tmp/altersend-cli
cp -r apps/cli/dist /tmp/altersend-cli/
cp apps/cli/package.json /tmp/altersend-cli/

# Stage and release
pear stage --no-ask pear://<your-link> /tmp/altersend-cli
pear release pear://<your-link>
```

After this, `altersend update` and `altersend check-update` will detect the new version.

**Placeholder detection:** The runtime crashes immediately if `package.json#upgrade` contains `REPLACE_WITH`. This prevents accidentally shipping with a fake link.

For automated releases via GitHub Actions, set a `PEAR_CLI_UPGRADE_LINK` repo variable and use `pear stage --no-ask "${{ vars.PEAR_CLI_UPGRADE_LINK }}" ...` in the workflow.

---

## Code Style

- Prettier: root `.prettierrc` (no override needed)
- ESLint: root config auto-runs on `apps/**` and `packages/**`
- TypeScript: root `tsconfig.json` with `strict: true`
- Husky + lint-staged on commit