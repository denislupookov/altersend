import { cp, readdir, readFile, stat, writeFile } from 'node:fs/promises'

const distRoot = new URL('../dist/', import.meta.url)
const importExportPattern =
  /((?:import|export)\s+(?:[^'\"]*?\s+from\s+)?)(['\"])(\.\.?(?:\/[^'\"]+)+)(\2)/g

const MODULE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.json'])

function withJsExtension(specifier) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return specifier
  for (const ext of MODULE_EXTENSIONS) {
    if (specifier.endsWith(ext)) return specifier
  }
  return `${specifier}.js`
}

async function rewriteFile(filePath) {
  const original = await readFile(filePath, 'utf8')
  const rewritten = original.replace(
    importExportPattern,
    (full, prefix, quote, specifier, suffix) => {
      return `${prefix}${quote}${withJsExtension(specifier)}${suffix}`
    }
  )

  if (rewritten !== original) {
    await writeFile(filePath, rewritten)
  }
}

async function walk(dirUrl) {
  const entries = await readdir(dirUrl, { withFileTypes: true })

  for (const entry of entries) {
    const entryUrl = new URL(entry.name, dirUrl)

    if (entry.isDirectory()) {
      await walk(new URL(`${entry.name}/`, dirUrl))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      await rewriteFile(entryUrl)
    }

    if (entry.isFile() && (entry.name.endsWith('.web.js') || entry.name.endsWith('.web.d.ts'))) {
      const targetName = entry.name.replace('.web.js', '.js').replace('.web.d.ts', '.d.ts')
      const targetUrl = new URL(targetName, dirUrl)
      await cp(entryUrl, targetUrl)
    }
  }
}

const distStats = await stat(distRoot).catch(() => null)
if (!distStats?.isDirectory()) process.exit(0)

await walk(distRoot)
