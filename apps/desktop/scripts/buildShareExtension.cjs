#!/usr/bin/env node
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const NAME = 'AlterSendShare'
const SOURCE_DIR = path.join(__dirname, '..', 'macos', 'ShareExtension')
const ENTITLEMENTS = path.join(__dirname, '..', 'build', 'entitlements.share.plist')
const MIN_MACOS = '11.0'

const SWIFT_TARGETS = {
  arm64: `arm64-apple-macos${MIN_MACOS}`,
  x64: `x86_64-apple-macos${MIN_MACOS}`
}

function sdkPath() {
  return execFileSync('xcrun', ['--show-sdk-path', '--sdk', 'macosx'], {
    encoding: 'utf-8'
  }).trim()
}

function writeInfoPlist(appexDir, version) {
  const source = fs.readFileSync(path.join(SOURCE_DIR, 'Info.plist'), 'utf-8')
  const short = String(version).split('-')[0]
  const patched = source.replace(
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${short}$2`
  ).replace(
    /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${short}$2`
  )
  fs.writeFileSync(path.join(appexDir, 'Contents', 'Info.plist'), patched)
}

function compile(binaryPath, arch) {
  const target = SWIFT_TARGETS[arch]
  if (!target) throw new Error(`buildShareExtension: unsupported arch "${arch}"`)

  execFileSync(
    'swiftc',
    [
      '-sdk', sdkPath(),
      '-target', target,
      '-module-name', NAME,
      '-parse-as-library',
      '-emit-executable',
      '-O',
      '-Xlinker', '-e', '-Xlinker', '_NSExtensionMain',
      '-framework', 'AppKit',
      '-framework', 'Foundation',
      '-o', binaryPath,
      path.join(SOURCE_DIR, 'ShareViewController.swift')
    ],
    { stdio: 'inherit' }
  )
}

function sign(appexDir, identity) {
  execFileSync(
    'codesign',
    [
      '--force',
      '--timestamp' + (identity === '-' ? '=none' : ''),
      ...(identity === '-' ? [] : ['--options', 'runtime']),
      '--entitlements', ENTITLEMENTS,
      '--sign', identity,
      appexDir
    ],
    { stdio: 'inherit' }
  )
}

function buildShareExtension({ outDir, arch, version, identity }) {
  const appexDir = path.join(outDir, `${NAME}.appex`)
  fs.rmSync(appexDir, { recursive: true, force: true })
  fs.mkdirSync(path.join(appexDir, 'Contents', 'MacOS'), { recursive: true })

  compile(path.join(appexDir, 'Contents', 'MacOS', NAME), arch)
  writeInfoPlist(appexDir, version)
  sign(appexDir, identity || '-')

  return appexDir
}

module.exports = { buildShareExtension }

if (require.main === module) {
  const [outDir, arch = process.arch, version = '0.0.0', identity] = process.argv.slice(2)
  if (!outDir) {
    console.error('usage: buildShareExtension.cjs <outDir> [arch] [version] [identity]')
    process.exit(1)
  }
  console.log(buildShareExtension({ outDir, arch, version, identity }))
}
