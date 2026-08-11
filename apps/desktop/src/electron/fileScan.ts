import { readdir, stat } from 'fs/promises'
import path from 'path'

type Limit = <T>(task: () => Promise<T>) => Promise<T>

const FOLDER_SCAN_CONCURRENCY = 16

function createLimit(max: number): Limit {
  let active = 0
  const queue: (() => void)[] = []
  const next = () => {
    if (active >= max) return
    const run = queue.shift()
    if (!run) return
    active++
    run()
  }

  return <T>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      queue.push(() => {
        task()
          .then(resolve, reject)
          .finally(() => {
            active--
            next()
          })
      })
      next()
    })
}

async function collectFolderFiles(rootDir: string, limit: Limit): Promise<PickedFile[]> {
  const files: PickedFile[] = []
  const walk = async (absDir: string, relDir: string): Promise<void> => {
    const entries = await limit(() => readdir(absDir, { withFileTypes: true }))
    await Promise.all(
      entries.map(async (entry) => {
        const abs = path.join(absDir, entry.name)
        const rel = `${relDir}/${entry.name}`
        if (entry.isDirectory()) {
          await walk(abs, rel)
        } else if (entry.isFile()) {
          const fileStats = await limit(() => stat(abs))
          files.push({ path: abs, name: entry.name, size: fileStats.size, relativePath: rel })
        }
      })
    )
  }
  await walk(rootDir, path.basename(rootDir))
  return files
}

async function expandOne(filePath: string, limit: Limit): Promise<PickedFile[]> {
  try {
    const fileStats = await limit(() => stat(filePath))
    if (fileStats.isDirectory()) return await collectFolderFiles(filePath, limit)
    return [{ path: filePath, name: path.basename(filePath), size: fileStats.size }]
  } catch (err) {
    console.error(`fileScan: skipping unreadable path ${filePath}`, err)
    return []
  }
}

export async function expandPaths(paths: string[]): Promise<PickedFile[]> {
  const limit = createLimit(FOLDER_SCAN_CONCURRENCY)
  const batches = await Promise.all(paths.map((filePath) => expandOne(filePath, limit)))
  return batches.flat()
}
