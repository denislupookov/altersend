#!/usr/bin/env node
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const version = process.argv[2]

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: node scripts/bump-version.js <version>  (e.g. 0.2.0)')
  process.exit(1)
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const packages = [
  'package.json',
  'apps/desktop/package.json',
  'apps/mobile/package.json',
  'packages/core/package.json',
  'packages/locales/package.json',
  'packages/domain/package.json',
  'packages/components/package.json',
]

const internalPackages = [
  '@altersend/core',
  '@altersend/locales',
  '@altersend/domain',
  '@altersend/components',
]

for (const rel of packages) {
  const path = resolve(root, rel)
  const pkg = JSON.parse(readFileSync(path, 'utf8'))

  pkg.version = version

  for (const dep of ['dependencies', 'devDependencies', 'peerDependencies']) {
    if (!pkg[dep]) continue
    for (const name of internalPackages) {
      if (pkg[dep][name]) pkg[dep][name] = version
    }
  }

  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`bumped ${rel}`)
}

const appJsonPath = resolve(root, 'apps/mobile/app.json')
const appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'))
appJson.expo.version = version
writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n')
console.log('bumped apps/mobile/app.json')

// Sync package-lock.json so `npm ci` (CI) stays in lockstep with the new versions.
console.log('updating package-lock.json…')
execSync('npm install --package-lock-only', { cwd: root, stdio: 'inherit' })

console.log(`\nversion → ${version}`)
