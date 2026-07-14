import { randomUUID } from 'crypto'
import { mkdir, rename, unlink, writeFile } from 'fs/promises'
import path from 'path'

export async function writeFileViaTemp(filePath: string, data: string | Buffer): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  const tmp = `${filePath}.${randomUUID()}.tmp`

  try {
    await writeFile(tmp, data)
    await rename(tmp, filePath)
  } catch (error) {
    await unlink(tmp).catch((cleanupError) => {
      console.warn('writeFileViaTemp: could not remove temp file', tmp, cleanupError)
    })
    throw error
  }
}
