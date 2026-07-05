#!/usr/bin/env node
/**
 * Electron-builder afterPack hook.
 *
 * 1. Prune native `prebuilds/<platform>-<arch>` dirs that don't match the
 *    current target. Native modules in the bare/holepunch ecosystem ship
 *    prebuilds for every platform (darwin/linux/win32/android/ios × x64/arm64
 *    + simulators).
 *
 * 2. Linux only: remove chrome-sandbox (squashfs/AppImage cannot preserve
 *    SUID bits, so Chromium's setuid sandbox probe crashes before Node.js
 *    even starts) and wrap the real Electron binary with a shell script that
 *    passes --no-sandbox. app.commandLine.appendSwitch('no-sandbox') in
 *    main.js is too late — Chromium's zygote sandbox decision happens
 *    before Node.js initializes. The wrapper ensures --no-sandbox reaches
 *    Chromium at process start.
 */
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')

const ARCH_NAMES = {
  0: 'ia32',
  1: 'x64',
  2: 'armv7l',
  3: 'arm64',
  4: 'universal'
}

exports.default = async function afterPack(context) {
  await copyMacLocalizations(context)
  await prunePrebuilds(context)

  if (context.electronPlatformName === 'linux') {
    await removeChromesSandbox(context)
    if (!process.env.FLATPAK_BUILD) {
      // Inside Flatpak, zypak-wrapper.sh handles sandboxing.
      // Only create the --no-sandbox wrapper for AppImage/other Linux builds.
      await wrapLinuxNoSandbox(context)
    }
  }
}

async function copyMacLocalizations(context) {
  if (context.electronPlatformName !== 'darwin' && context.electronPlatformName !== 'mas') return

  const sourceDir = path.join(__dirname, '..', 'build', 'locales')
  if (!fs.existsSync(sourceDir)) return

  const appName = context.packager.appInfo.productFilename
  const resourcesDir = path.join(context.appOutDir, `${appName}.app`, 'Contents', 'Resources')
  const localeEntries = (await safeReadDir(sourceDir)).filter(
    (entry) => entry.isDirectory() && entry.name.endsWith('.lproj')
  )

  for (const entry of localeEntries) {
    const targetDir = path.join(resourcesDir, entry.name)
    await fsp.mkdir(targetDir, { recursive: true })
    await fsp.copyFile(
      path.join(sourceDir, entry.name, 'InfoPlist.strings'),
      path.join(targetDir, 'InfoPlist.strings')
    )
  }

  console.log(`afterPack: copied ${localeEntries.length} macOS localization dir(s)`)
}

async function prunePrebuilds(context) {
  const { appOutDir, electronPlatformName, arch, packager } = context
  const archName = ARCH_NAMES[arch] ?? String(arch)
  const target = `${electronPlatformName}-${archName}`

  let appRoot
  if (electronPlatformName === 'darwin' || electronPlatformName === 'mas') {
    const appName = packager.appInfo.productFilename
    appRoot = path.join(appOutDir, `${appName}.app`, 'Contents', 'Resources', 'app')
  } else {
    appRoot = path.join(appOutDir, 'resources', 'app')
  }

  const nodeModules = path.join(appRoot, 'node_modules')
  if (!fs.existsSync(nodeModules)) {
    console.warn(`afterPack: node_modules not found at ${nodeModules}, skipping prune`)
    return
  }

  const stats = { kept: 0, removed: 0, bytes: 0 }
  await pruneTree(appRoot, target, stats)

  const mb = (stats.bytes / (1024 * 1024)).toFixed(1)
  console.log(
    `afterPack: pruned ${stats.removed} prebuild dir(s), kept ${stats.kept} ` +
      `matching '${target}'/-universal, freed ~${mb} MB`
  )
}

async function pruneTree(base, target, stats) {
  await pruneOneLevel(path.join(base, 'prebuilds'), target, stats)

  const nm = path.join(base, 'node_modules')
  const entries = await safeReadDir(nm)
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory()) return
      const full = path.join(nm, entry.name)
      if (entry.name.startsWith('@')) {
        const subs = await safeReadDir(full)
        await Promise.all(
          subs.map((sub) =>
            sub.isDirectory() ? pruneTree(path.join(full, sub.name), target, stats) : null
          )
        )
      } else {
        await pruneTree(full, target, stats)
      }
    })
  )
}

async function pruneOneLevel(dir, target, stats) {
  const entries = await safeReadDir(dir)
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name === target || entry.name.endsWith('-universal')) {
      stats.kept++
      continue
    }
    const full = path.join(dir, entry.name)
    stats.bytes += await dirSize(full)
    await fsp.rm(full, { recursive: true, force: true })
    stats.removed++
  }
}

async function safeReadDir(dir) {
  try {
    return await fsp.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

async function dirSize(dir) {
  let total = 0
  const stack = [dir]
  while (stack.length) {
    const d = stack.pop()
    let entries
    try {
      entries = await fsp.readdir(d, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      const full = path.join(d, e.name)
      try {
        if (e.isDirectory()) stack.push(full)
        else {
          const s = await fsp.stat(full)
          total += (s.blocks ?? 0) * 512 || s.size
        }
      } catch {}
    }
  }
  return total
}

async function removeChromesSandbox(context) {
  const sandboxBin = path.join(context.appOutDir, 'chrome-sandbox')
  if (fs.existsSync(sandboxBin)) {
    fs.unlinkSync(sandboxBin)
    console.log(`afterPack: removed ${sandboxBin}`)
  }
}

async function wrapLinuxNoSandbox(context) {
  const appOutDir = context.appOutDir

  const execName = context.packager.executableName
  const realBin = path.join(appOutDir, execName)
  const renamedBin = path.join(appOutDir, `${execName}.bin`)

  if (!fs.existsSync(realBin)) {
    console.warn(`afterPack: executable not found at ${realBin}, skipping wrapper`)
    return
  }

  fs.renameSync(realBin, renamedBin)

  const wrapper = [
    '#!/bin/bash',
    `exec "$(dirname "$(readlink -f "$0")")/${execName}.bin" --no-sandbox "$@"`,
    ''
  ].join('\n')

  fs.writeFileSync(realBin, wrapper, { mode: 0o755 })
  console.log(`afterPack: created --no-sandbox wrapper for ${execName}`)
}
