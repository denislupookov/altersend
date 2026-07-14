import { mkdir, rename, writeFile } from 'fs/promises'
import path from 'path'

export async function writeFileViaTemp(filePath: string, data: string | Buffer): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  const tmp = `${filePath}.tmp`
  await writeFile(tmp, data)
  await rename(tmp, filePath)
}
