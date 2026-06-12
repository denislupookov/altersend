import { createRequire } from 'module'
import path from 'path'
import { createCliRuntime } from '../runtime.js'

const _require = createRequire(__filename)
const pkg = _require(path.join(__dirname, '..', '..', 'package.json')) as { version: string }

const CHECK_TIMEOUT_MS = 5000

export async function checkUpdate(_options: Record<string, unknown>): Promise<void> {
  let runtime: Awaited<ReturnType<typeof createCliRuntime>> | null = null

  try {
    runtime = await createCliRuntime()

    if (runtime.pear.updater.updated) {
      console.log('Update available. Run \'altersend update\' to apply.')
      runtime.destroy()
      return
    }

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        runtime?.pear.updater.removeListener('updated', onUpdated)
        resolve()
      }, CHECK_TIMEOUT_MS)

      const onUpdated = () => {
        clearTimeout(timeout)
        runtime?.pear.updater.removeListener('updated', onUpdated)
        console.log('Update available. Run \'altersend update\' to apply.')
        runtime?.destroy()
        resolve()
      }

      runtime!.pear.updater.on('updated', onUpdated)
    })

    if (!runtime.pear.updater.updated) {
      console.log(`Up to date (v${pkg.version}).`)
    }

    runtime.destroy()
  } catch (err) {
    console.error('Error checking for updates:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}
