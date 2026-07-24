import fs from 'bare-fs'

export function fileExists(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    ;(fs as unknown as { stat(p: string, cb: (e: unknown) => void): void }).stat(filePath, (err) =>
      resolve(!err)
    )
  })
}
