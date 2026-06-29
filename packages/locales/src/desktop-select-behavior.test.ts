import { describe, expect, it } from 'vitest'

const selectBehaviorModulePath = new URL(
  '../../../apps/desktop/src/renderer/components/Select/selectBehavior.ts',
  import.meta.url
).pathname

describe('desktop Select behavior', () => {
  it('closes the listbox before notifying consumers about a changed option', async () => {
    const { chooseSelectOption } = await import(/* @vite-ignore */ selectBehaviorModulePath)
    const events: string[] = []

    chooseSelectOption({
      option: { value: 'ko-KR', label: 'Korean' },
      currentValue: 'en-US',
      close: () => events.push('close'),
      onChange: (value: string) => events.push(`change:${value}`)
    })

    expect(events).toEqual(['close', 'change:ko-KR'])
  })

  it('closes the listbox without firing onChange when the current option is selected', async () => {
    const { chooseSelectOption } = await import(/* @vite-ignore */ selectBehaviorModulePath)
    const events: string[] = []

    chooseSelectOption({
      option: { value: 'en-US', label: 'English' },
      currentValue: 'en-US',
      close: () => events.push('close'),
      onChange: (value: string) => events.push(`change:${value}`)
    })

    expect(events).toEqual(['close'])
  })

  it('handles keyboard navigation without relying on the native select popup', async () => {
    const { getNextSelectKeyboardState } = await import(/* @vite-ignore */ selectBehaviorModulePath)

    expect(
      getNextSelectKeyboardState({
        key: 'ArrowDown',
        open: true,
        selectedIndex: 0,
        highlightedIndex: 0,
        optionCount: 3
      })
    ).toEqual({ action: 'highlight', highlightedIndex: 1, preventDefault: true })

    expect(
      getNextSelectKeyboardState({
        key: 'Escape',
        open: true,
        selectedIndex: 0,
        highlightedIndex: 1,
        optionCount: 3
      })
    ).toEqual({ action: 'close', preventDefault: true })
  })
})
