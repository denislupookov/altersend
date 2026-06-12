import { createCliRuntime } from '../runtime.js'

export async function status(options: { storage?: string; updates?: boolean }): Promise<void> {
  try {
    const { client: _client, destroy } = await createCliRuntime(options.storage, undefined, options.updates)
    console.log('Checking transfer status...')
    destroy()
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}