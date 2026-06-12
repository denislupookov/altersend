import { createCliRuntime } from '../runtime.js'

export async function disconnect(_options: Record<string, unknown>): Promise<void> {
  try {
    const { client, destroy } = await createCliRuntime()
    await client.closePeers()
    console.log('Disconnected.')
    destroy()
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}