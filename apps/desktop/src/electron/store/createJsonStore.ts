import { app } from 'electron'
import { readFile } from 'fs/promises'
import path from 'path'
import { writeFileViaTemp } from './writeFileViaTemp.js'

export interface JsonStore<T> {
  read(): Promise<T>
  write(value: T): Promise<void>
}

export function createJsonStore<T extends object>(filename: string, fallback: T): JsonStore<T> {
  let pending: Promise<unknown> = Promise.resolve()

  const storePath = () => path.join(app.getPath('userData'), filename)

  return {
    async read() {
      try {
        const parsed = JSON.parse(await readFile(storePath(), 'utf8')) as Partial<T>
        return { ...fallback, ...parsed }
      } catch {
        return fallback
      }
    },

    write(value) {
      const write = pending.then(() => writeFileViaTemp(storePath(), JSON.stringify(value)))
      pending = write.catch((err) => {
        console.warn(`[store] could not persist ${filename}`, err)
      })
      return write
    }
  }
}
