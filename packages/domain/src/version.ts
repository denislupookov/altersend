interface ParsedVersion {
  numbers: number[]
  prerelease: string[]
}

const VERSION_PATTERN = /^v?(\d+(?:\.\d+)*)(?:-([0-9A-Za-z.-]+))?/

function parseVersion(version: string): ParsedVersion {
  const match = VERSION_PATTERN.exec(version.trim())
  if (!match) return { numbers: [], prerelease: [] }

  return {
    numbers: match[1].split('.').map((part) => Number(part) || 0),
    prerelease: match[2] ? match[2].split('.') : []
  }
}

function comparePrerelease(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0
  if (a.length === 0) return 1
  if (b.length === 0) return -1

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const left = a[i]
    const right = b[i]
    if (left === undefined) return -1
    if (right === undefined) return 1
    if (left === right) continue

    const leftIsNumber = /^\d+$/.test(left)
    const rightIsNumber = /^\d+$/.test(right)
    if (leftIsNumber && rightIsNumber) return Number(left) < Number(right) ? -1 : 1
    if (leftIsNumber) return -1
    if (rightIsNumber) return 1

    return left < right ? -1 : 1
  }

  return 0
}

export function compareVersions(a: string, b: string): number {
  const left = parseVersion(a)
  const right = parseVersion(b)

  for (let i = 0; i < Math.max(left.numbers.length, right.numbers.length); i++) {
    const diff = (left.numbers[i] ?? 0) - (right.numbers[i] ?? 0)
    if (diff !== 0) return diff < 0 ? -1 : 1
  }

  return comparePrerelease(left.prerelease, right.prerelease)
}

export function isNewerVersion(candidate: string, base: string): boolean {
  return compareVersions(candidate, base) > 0
}
