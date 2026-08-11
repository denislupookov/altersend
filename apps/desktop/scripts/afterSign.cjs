#!/usr/bin/env node
const { execFileSync, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { buildShareExtension } = require('./buildShareExtension.cjs')
const notarizeHook = require('./notarize.cjs').default

const ARCH_NAMES = { 1: 'x64', 3: 'arm64' }

function signingIdentity(appPath) {
  const result = spawnSync('codesign', ['-dvv', appPath], { encoding: 'utf-8' })
  const output = `${result.stdout || ''}${result.stderr || ''}`
  if (/Signature=adhoc/.test(output)) return '-'
  const authority = output.match(/^Authority=(.+)$/m)
  return authority ? authority[1].trim() : '-'
}

async function embedShareExtension(context) {
  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(context.appOutDir, `${appName}.app`)
  const pluginsDir = path.join(appPath, 'Contents', 'PlugIns')
  const arch = ARCH_NAMES[context.arch] ?? String(context.arch)
  const identity = signingIdentity(appPath)

  fs.mkdirSync(pluginsDir, { recursive: true })
  buildShareExtension({
    outDir: pluginsDir,
    arch,
    version: context.packager.appInfo.version,
    identity
  })

  execFileSync(
    'codesign',
    [
      '--force',
      ...(identity === '-' ? [] : ['--options', 'runtime', '--timestamp']),
      '--entitlements', path.join(__dirname, '..', 'build', 'entitlements.mac.plist'),
      '--sign', identity,
      appPath
    ],
    { stdio: 'inherit' }
  )

  console.log(`afterSign: embedded Share extension (${arch}, identity ${identity})`)
}

exports.default = async function afterSign(context) {
  if (context.electronPlatformName === 'darwin') {
    await embedShareExtension(context)
  }
  await notarizeHook(context)
}
