export const RATED_COOLDOWN_DAYS = 365

const DAY_MS = 86_400_000
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function localDay(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function dayToUtc(day: string): number | null {
  const match = DAY_PATTERN.exec(day)
  if (!match) return null
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export function ratingDue(ratedAt: string | null, today: string): boolean {
  if (ratedAt === null) return true
  const start = dayToUtc(ratedAt)
  const end = dayToUtc(today)
  if (start === null || end === null) return true
  return Math.round((end - start) / DAY_MS) >= RATED_COOLDOWN_DAYS
}
