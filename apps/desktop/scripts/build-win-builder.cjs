#!/usr/bin/env node
const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const desktopDir = path.resolve(__dirname, '..')
const repoRoot = path.resolve(desktopDir, '..', '..')
const deployDir = path.join(os.tmpdir(), 'altersend-desktop-win-deploy')
const pnpmCli = process.env.npm_execpath
const electronBuilderCli = require.resolve('electron-builder/out/cli/cli.js', { paths: [desktopDir] })
const tscCli = require.resolve('typescript/bin/tsc', { paths: [desktopDir] })
const vitePackageJson = require.resolve('vite/package.json', { paths: [desktopDir] })
const viteCli = path.join(path.dirname(vitePackageJson), 'bin', 'vite.js')
const electronPackageJson = require.resolve('electron/package.json', { paths: [desktopDir] })
const electronDist = path.join(path.dirname(electronPackageJson), 'dist')

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: { ...process.env, CI: 'true', ...options.env },
    stdio: 'inherit',
    windowsHide: false,
    shell: options.shell ?? false
  })
}

function runPnpm(args) {
  if (pnpmCli) {
    run(process.execPath, [pnpmCli, ...args])
    return
  }
  run(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, {
    shell: process.platform === 'win32'
  })
}

fs.rmSync(deployDir, { recursive: true, force: true })

run(process.execPath, ['scripts/gen-sentry-dsn.cjs'], { cwd: desktopDir })
run(process.execPath, [tscCli, '-p', 'src/tsconfig.electron.json'], { cwd: desktopDir })
run(process.execPath, ['scripts/copy-preload.cjs'], { cwd: desktopDir })
run(process.execPath, [viteCli, 'build'], { cwd: desktopDir })
runPnpm(['--filter', '@altersend/desktop', 'deploy', '--prod', '--legacy', '--config.node-linker=hoisted', deployDir])
run(
  process.execPath,
  [
    electronBuilderCli,
    '--win',
    '--x64',
    '--projectDir',
    deployDir,
    '--config',
    path.join(deployDir, 'electron-builder.windows.json'),
    `--config.electronDist=${electronDist}`,
    `--config.directories.output=${path.join(desktopDir, 'out')}`,
    '--config.npmRebuild=false',
    '--publish',
    'never'
  ],
  { cwd: deployDir }
)
