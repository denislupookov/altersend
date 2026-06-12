import { createCliRuntime } from '../runtime.js'

export async function status(_options: Record<string, unknown>): Promise<void> {
  try {
    const { client, destroy } = await createCliRuntime()
    console.log('Checking transfer status...')
    destroy()
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}