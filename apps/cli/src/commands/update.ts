import { createRequire } from 'module'
import path from 'path'
import { createCliRuntime } from '../runtime.js'

const _require = createRequire(__filename)
const pkg = _require(path.join(__dirname, '..', '..', 'package.json')) as { version: string }

const CHECK_TIMEOUT_MS = 10000

export async function update(options: { storage?: string; updates?: boolean }): Promise<void> {
  let runtime: Awaited<ReturnType<typeof createCliRuntime>> | null = null

  try {
    runtime = await createCliRuntime(options.storage, undefined, options.updates)

    if (runtime.pear.updater.updated) {
      await runtime.pear.updater.applyUpdate()
      console.log('Update applied. Run \'altersend ...\' again to use the new version.')
      runtime.destroy()
      process.exit(0)
    }

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        runtime?.pear.updater.removeListener('updated', onUpdated)
        console.log(`Already up to date (v${pkg.version}).`)
        resolve()
      }, CHECK_TIMEOUT_MS)

      const onUpdated = async () => {
        clearTimeout(timeout)
        runtime?.pear.updater.removeListener('updated', onUpdated)
        await runtime!.pear.updater.applyUpdate()
        console.log('Update applied. Run \'altersend ...\' again to use the new version.')
        runtime?.destroy()
        resolve()
      }

      runtime!.pear.updater.on('updated', onUpdated)
    })

    runtime.destroy()
    process.exit(0)
  } catch (err) {
    console.error('Error applying update:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}
