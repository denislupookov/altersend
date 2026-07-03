import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const selectorSource = readFileSync(new URL('./FeedbackTypeSelector.tsx', import.meta.url), 'utf8')
const tabsStyles = readFileSync(new URL('../Tabs/styles.ts', import.meta.url), 'utf8')

function getStyleBlock(name: string, followingName: string): string {
  const block = tabsStyles.match(
    new RegExp(`\\n  ${name}: \\{([\\s\\S]*?)\\n  \\},\\n  ${followingName}`)
  )?.[1]

  expect(block).toBeDefined()
  return block ?? ''
}

describe('FeedbackTypeSelector layout', () => {
  it('renders through the shared Tabs component', () => {
    expect(selectorSource).toContain('TabsTrigger')
    expect(selectorSource).toContain('stretch')
  })

  it('keeps long translated labels inside single-line segments', () => {
    const triggerStretch = getStyleBlock('triggerStretch', 'triggerDisabled')
    const triggerLabel = getStyleBlock('triggerLabel', 'triggerLabelActive')

    expect(triggerStretch).toContain('minWidth: 0')
    expect(triggerLabel).toContain("overflow: 'hidden'")
    expect(triggerLabel).toContain("textOverflow: 'ellipsis'")
    expect(triggerLabel).toContain("whiteSpace: 'nowrap'")
    expect(triggerLabel).not.toContain('overflowWrap')
  })
})
