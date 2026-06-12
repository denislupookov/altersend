import { createCliRuntime } from '../runtime.js'

export async function cancel(options: { storage?: string; updates?: boolean }): Promise<void> {
  try {
    const { client: _client, destroy } = await createCliRuntime(options.storage, undefined, options.updates)
    console.log('Cancelling transfer...')
    destroy()
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}