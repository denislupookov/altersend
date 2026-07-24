export interface TextSegment {
  text: string
  url?: string
}

const TRAILING_URL_PUNCT = new Set(['.', ',', ';', ':', '!', '?', ')', ']', '}', "'", '"'])

function stripTrailingPunctuation(url: string): string {
  let end = url.length
  while (end > 0 && TRAILING_URL_PUNCT.has(url[end - 1])) end--
  return url.slice(0, end)
}

export function linkifyText(text: string): TextSegment[] {
  const pattern = /https?:\/\/[^\s]+/g
  const segments: TextSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    const raw = stripTrailingPunctuation(match[0])
    if (match.index > lastIndex) segments.push({ text: text.slice(lastIndex, match.index) })
    segments.push({ text: raw, url: raw })
    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex) })
  return segments
}
