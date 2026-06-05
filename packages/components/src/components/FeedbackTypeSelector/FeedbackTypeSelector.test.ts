import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./FeedbackTypeSelector.tsx', import.meta.url), 'utf8')

function getStyleBlock(name: string, followingName: string): string {
  const block = source.match(
    new RegExp(`\\n  ${name}: \\{([\\s\\S]*?)\\n  \\},\\n  ${followingName}`)
  )?.[1]

  expect(block).toBeDefined()
  return block ?? ''
}

describe('FeedbackTypeSelector layout', () => {
  it('keeps long translated labels inside fixed-height segments', () => {
    const chipStyle = getStyleBlock('chip', 'chipDefault')
    const labelStyle = getStyleBlock('label', 'labelDefault')

    expect(chipStyle).toContain('minWidth: 0')
    expect(chipStyle).toContain('minHeight:')
    expect(labelStyle).toContain("overflow: 'hidden'")
    expect(labelStyle).toContain("textOverflow: 'ellipsis'")
    expect(labelStyle).toContain("whiteSpace: 'nowrap'")
    expect(labelStyle).not.toContain('overflowWrap')
  })
})
