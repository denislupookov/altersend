const fs = require('fs')
const path = require('path')
const pkg = require('./package.json')
const appName = pkg.productName ?? pkg.name
const { isWindows } = require('which-runtime')

function getWindowsKitVersion() {
  const programFiles = process.env['PROGRAMFILES(X86)'] || process.env.PROGRAMFILES
  if (!programFiles) return undefined
  const kitsDir = path.join(programFiles, 'Windows Kits')
  try {
    for (const kit of fs.readdirSync(kitsDir).sort().reverse()) {
      const binDir = path.join(kitsDir, kit, 'bin')
      if (!fs.existsSync(binDir)) continue
      const version = fs
        .readdirSync(binDir)
        .filter((d) => /^\d+\.\d+\.\d+\.\d+$/.test(d))
        .sort()
        .pop()
      if (version) return version
    }
  } catch {
    return undefined
  }
}

async function prunePrebuilds(outputPath, platform, arch) {
  let appRoot
  if (platform === 'darwin') {
    let entries = []
    try { entries = await fs.promises.readdir(outputPath, { withFileTypes: true }) } catch {}
    const appEntry = entries.find(e => e.isDirectory() && e.name.endsWith('.app'))
    if (!appEntry) { console.warn(`prunePrebuilds: no .app found in ${outputPath}`); return }
    appRoot = path.join(outputPath, appEntry.name, 'Contents', 'Resources', 'app')
  } else {
    appRoot = path.join(outputPath, 'resources', 'app')
  }

  if (!fs.existsSync(path.join(appRoot, 'node_modules'))) {
    console.warn(`prunePrebuilds: node_modules not found at ${appRoot}`)
    return
  }

  const target = `${platform}-${arch}`
  const stats = { kept: 0, removed: 0, bytes: 0 }
  await pruneTree(appRoot, target, stats)

  const mb = (stats.bytes / (1024 * 1024)).toFixed(1)
  console.log(`prunePrebuilds: pruned ${stats.removed} dirs, kept ${stats.kept} matching '${target}'/-universal, freed ~${mb} MB`)
}

async function pruneTree(base, target, stats) {
  await pruneOneLevel(path.join(base, 'prebuilds'), target, stats)
  let entries = []
  try { entries = await fs.promises.readdir(path.join(base, 'node_modules'), { withFileTypes: true }) } catch {}
  await Promise.all(entries.map(async (entry) => {
    if (!entry.isDirectory()) return
    const full = path.join(base, 'node_modules', entry.name)
    if (entry.name.startsWith('@')) {
      let subs = []
      try { subs = await fs.promises.readdir(full, { withFileTypes: true }) } catch {}
      await Promise.all(subs.map(sub => sub.isDirectory() ? pruneTree(path.join(full, sub.name), target, stats) : null))
    } else {
      await pruneTree(full, target, stats)
    }
  }))
}

async function pruneOneLevel(dir, target, stats) {
  let entries = []
  try { entries = await fs.promises.readdir(dir, { withFileTypes: true }) } catch {}
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name === target || entry.name.endsWith('-universal')) { stats.kept++; continue }
    const full = path.join(dir, entry.name)
    stats.bytes += await dirSize(full)
    await fs.promises.rm(full, { recursive: true, force: true })
    stats.removed++
  }
}

async function dirSize(dir) {
  let total = 0
  const stack = [dir]
  while (stack.length) {
    const d = stack.pop()
    let entries = []
    try { entries = await fs.promises.readdir(d, { withFileTypes: true }) } catch {}
    for (const e of entries) {
      const full = path.join(d, e.name)
      try {
        if (e.isDirectory()) stack.push(full)
        else { const s = await fs.promises.stat(full); total += (s.blocks ?? 0) * 512 || s.size }
      } catch {}
    }
  }
  return total
}

let packagerConfig = {
  icon: path.join(__dirname, 'build/icon'),
  protocols: [{ name: appName, schemes: ['altersend'] }],
  derefSymlinks: true,
  ignore: [
    /(^|\/)node_modules\/react-native[^/]*(\/|$)/,
    /(^|\/)node_modules\/@react-native(\/|$)/,
    /(^|\/)node_modules\/@expo(\/|$)/,
    /(^|\/)node_modules\/expo-[^/]+(\/|$)/,
    // Build-only tools
    /(^|\/)node_modules\/@babel(\/|$)/,
    /(^|\/)node_modules\/@types(\/|$)/,
    /(^|\/)node_modules\/@stylexjs(\/|$)/,
    /(^|\/)node_modules\/@jridgewell(\/|$)/,
    /(^|\/)node_modules\/caniuse-lite(\/|$)/,
    /(^|\/)node_modules\/acorn(\/|$)/,
    /(^|\/)node_modules\/fast-glob(\/|$)/,
    /(^|\/)node_modules\/@nodelib(\/|$)/,
    /(^|\/)node_modules\/baseline-browser-mapping(\/|$)/,
    // Renderer-only packages — bundled by Vite into dist/renderer, not loaded at runtime
    /(^|\/)node_modules\/lucide-react(\/|$)/,
    /(^|\/)node_modules\/react-dom(\/|$)/,
    /(^|\/)node_modules\/react-strict-dom(\/|$)/,
    // Source and config files not needed in production
    /^\/src(\/|$)/,
    /^\/scripts(\/|$)/,
    /^\/e2e($|\/)/,
    /^\/docs($|\/)/,
    /^\/babel\.config\.cjs$/,
    /^\/postcss\.config\.mjs$/,
    /^\/vite\.config\.ts$/,
    /^\/tsconfig\.json$/,
    /^\/CHANGELOG\.md$/,
    /^\/README\.md$/,
    /^\/forge\.config\.cjs$/,
  ]
}

if (process.env.MAC_CODESIGN_IDENTITY) {
  packagerConfig = {
    ...packagerConfig,
    osxSign: {
      identity: process.env.MAC_CODESIGN_IDENTITY
    },
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    }
  }
}

module.exports = {
  packagerConfig,

  makers: [
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {}
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: appName,
        authors: pkg.author || appName,
        description: pkg.description || appName,
        ...(process.env.WINDOWS_CERTIFICATE_FILE
          ? {
              certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
              certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD
            }
          : {})
      }
    },
    {
      name: '@electron-forge/maker-msix',
      platforms: isWindows ? ['win32'] : [],
      config: {
        appManifest: path.join(__dirname, 'out', 'manifest', 'AppxManifest.xml'),
        packageAssets: path.join(__dirname, 'build', 'msix-assets'),
        windowsKitVersion: getWindowsKitVersion(),
        ...(process.env.WINDOWS_CERTIFICATE_FILE
          ? {
              windowsSignOptions: {
                certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
                certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD
              }
            }
          : {})
      }
    }
  ],

  hooks: {
    prePackage: async () => {
      const rootNM = path.join(__dirname, '..', '..', 'node_modules')
      const localNM = path.join(__dirname, 'node_modules')
      const created = []
      for (const entry of fs.readdirSync(rootNM)) {
        const localPath = path.join(localNM, entry)
        if (!fs.existsSync(localPath)) {
          fs.symlinkSync(path.join(rootNM, entry), localPath)
          created.push(localPath)
        }
      }
      global.__forgeSymlinks = created
    },
    postPackage: async (_config, { platform, arch, outputPaths }) => {
      for (const p of global.__forgeSymlinks ?? []) {
        try { fs.unlinkSync(p) } catch {}
      }
      await Promise.all(outputPaths.map(p => prunePrebuilds(p, platform, arch)))
    },
    preMake: async () => {
      fs.rmSync(path.join(__dirname, 'out', 'make'), { recursive: true, force: true })

      const sourceManifest = path.join(__dirname, 'build', 'AppxManifest.xml')
      const outManifest = path.join(__dirname, 'out', 'manifest', 'AppxManifest.xml')
      const baseVersion = String(pkg.version).split('-')[0]
      if (!/^\d+\.\d+\.\d+$/.test(baseVersion)) {
        throw new Error(`Invalid pkg.version "${pkg.version}" — MSIX needs MAJOR.MINOR.PATCH (with optional -tag)`)
      }
      const msixVersion = `${baseVersion}.0`
      const xml = fs.readFileSync(sourceManifest, 'utf-8')
      fs.mkdirSync(path.dirname(outManifest), { recursive: true })
      fs.writeFileSync(outManifest, xml.replace(/Version="[^"]*"/, `Version="${msixVersion}"`))
    },
    postMake: async (forgeConfig, results) => {
      for (const result of results) {
        if (result.platform !== 'win32') continue
        for (const artifact of result.artifacts) {
          if (!artifact.endsWith('.msix')) continue
          const standardDir = path.join(__dirname, 'out', `${appName}-win32-${result.arch}`)
          fs.mkdirSync(standardDir, { recursive: true })
          const dest = path.join(standardDir, path.basename(artifact))
          fs.renameSync(artifact, dest)
          result.artifacts[result.artifacts.indexOf(artifact)] = dest
        }
      }
      // Keep out/make — Squirrel's Setup.exe + nupkg + RELEASES live there and must survive for upload
    }
  },

  plugins: []
}
