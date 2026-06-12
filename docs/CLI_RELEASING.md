# CLI Releasing

This document covers how to release the AlterSend CLI to its own pear upgrade channel.

## Overview

The CLI ships via [pear](https://pear.software) — the same infrastructure used by the desktop app. Each release channel is identified by a `pear://` link, which is a unique address on the pear DHT.

The desktop app uses `pear://w5u4xqsncqyfhb1owdqogr3mpg6b5tcdzn65pk88ispgew5jegso` (stored in `apps/desktop/package.json#upgrade`). The CLI gets its own separate link.

## Step 1: Mint a pear link for the CLI

**One-time setup.** Run this in the repo root or `apps/cli/` directory:

```bash
# Ensure pear CLI is installed
npm install -g pear

# Mint a new link (interactive — generates a 64-char hex topic)
pear init

# Output: pear://<64-hex-chars>
```

Paste the output into `apps/cli/package.json#upgrade`:

```json
{
  "upgrade": "pear://<your-minted-link>"
}
```

Then rebuild:

```bash
npm run cli:build
```

## Step 2: Stage a build

When you have a new version to release, stage the CLI build to the pear DHT:

```bash
# Build the CLI
npm run cli:build

# Package the CLI build directory into a tarball
mkdir -p /tmp/altersend-cli
cp -r apps/cli/dist /tmp/altersend-cli/
cp apps/cli/package.json /tmp/altersend-cli/

# Stage to pear (requires pear CLI installed)
pear stage --no-ask pear://<your-minted-link> /tmp/altersend-cli

# Release the staged build
pear release pear://<your-minted-link>
```

After this, `altersend update` and `altersend check-update` will detect the new version.

## Step 3: Set up GitHub Actions variable

If you want automated releases via CI (future workflow):

1. Go to the repo's **Settings → Secrets and variables → Actions → Variables**
2. Add a new repository variable:
   - **Name:** `PEAR_CLI_UPGRADE_LINK`
   - **Value:** `pear://<your-minted-link>`
3. The release workflow will use `pear stage --no-ask "${{ vars.PEAR_CLI_UPGRADE_LINK }}" ...`

## How updates work at runtime

1. `pear-runtime` checks the pear DHT on boot for the upgrade link
2. If a newer version is staged under the link, `updater.updated` is set to `true`
3. The `updater.on('updated', cb)` event fires during the current session
4. `altersend update` calls `updater.applyUpdate()` to stage the new files locally
5. The user runs `altersend ...` again to use the new version

## Placeholder detection

The runtime crashes immediately at startup if `apps/cli/package.json#upgrade` contains `REPLACE_WITH`. This prevents accidentally shipping a build with a fake link.

The error message points contributors to this file:

```
apps/cli/package.json#upgrade is a placeholder.
Run `npx pear init` in apps/cli/, paste the resulting pear:// link, then rebuild.
See docs/CLI_RELEASING.md for details.
```

## Versioning

The CLI version is in `apps/cli/package.json#version`. Bump it before each release:

```bash
# Using the repo's version script
node scripts/bump-version.js cli

# Or manually edit apps/cli/package.json
```

The `pear-runtime` constructor reads this version and compares it against what's staged on the DHT.

## Future: GitHub Actions workflow

A release workflow file `.github/workflows/release-cli.yml` will automate staging and releasing. The workflow will:

1. Trigger on a tag push like `cli-v1.2.1`
2. Build the CLI (`npm run cli:build`)
3. Package and stage the build to pear
4. Release to the DHT

This is not yet implemented. For now, releases are done manually using the steps above.
