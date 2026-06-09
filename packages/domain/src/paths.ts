export function getParentDir(filePath: string): string {
  const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  return lastSlash > 0 ? filePath.slice(0, lastSlash) : filePath
}

export function fileUriToPath(uri: string): string {
  if (!uri.startsWith('file://')) return uri
  const path = uri.slice('file://'.length)
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

export function shortenHomePath(p: string): string {
  const home = p.match(/^\/Users\/[^/]+/)?.[0]
  return home ? p.replace(home, '~') : p
}
