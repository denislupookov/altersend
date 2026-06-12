import { createCliRuntime } from '../runtime.js'

export async function disconnect(options: { storage?: string; updates?: boolean }): Promise<void> {
  try {
    const { client, destroy } = await createCliRuntime(options.storage, undefined, options.updates)
    await client.closePeers()
    console.log('Disconnected.')
    destroy()
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}