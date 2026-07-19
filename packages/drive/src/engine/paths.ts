import path from '#path'

const MAX_NAME_VARIANTS = 999

function numberedPath(filePath: string, n: number): string {
  const dir = path.dirname(filePath)
  const name = path.basename(filePath)
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  return path.join(dir, `${base} (${n})${ext}`)
}

export async function firstFreePath(
  filePath: string,
  isFree: (candidate: string) => boolean | Promise<boolean>
): Promise<string> {
  if (await isFree(filePath)) return filePath
  for (let n = 1; n <= MAX_NAME_VARIANTS; n++) {
    const candidate = numberedPath(filePath, n)
    if (await isFree(candidate)) return candidate
  }
  return filePath
}
