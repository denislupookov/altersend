export function triggerDownload(data: Blob | Uint8Array, fileName: string): void {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'download.bin'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 15000)
}
