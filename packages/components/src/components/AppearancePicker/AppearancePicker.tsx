import { html } from 'react-strict-dom'
import { useRovingRadio } from '../../a11y/useRovingRadio'
import { CheckIcon } from '../../icons'
import { MenuGroup } from '../Menu'
import {
  SYSTEM_THEME_PREFERENCE,
  THEME_PREFERENCE_OPTIONS,
  ThemeType,
  rawTokens,
  useTheme,
  type ThemeColors,
  type ThemePreference
} from '../../theme'
import { AppearanceWindow } from './AppearanceWindow'
import { styles } from './styles'

const { light, dark } = rawTokens.colors

type DivElementProps = Parameters<typeof html.div>[0]
type TileKeyboardEvent = Parameters<NonNullable<DivElementProps['onKeyDown']>>[0] & {
  preventDefault?: () => void
}

interface PreviewPalette {
  start: ThemeColors
  end?: ThemeColors
}

const PREVIEW_PALETTES: Record<ThemePreference, PreviewPalette> = {
  [ThemeType.Light]: { start: light },
  [ThemeType.Dark]: { start: dark },
  [SYSTEM_THEME_PREFERENCE]: { start: light, end: dark }
}

export interface AppearancePickerProps {
  value: ThemePreference
  labels: Record<ThemePreference, string>
  onChange: (preference: ThemePreference) => void
  title?: string
}

export function AppearancePicker({ value, labels, onChange, title }: AppearancePickerProps) {
  const { theme } = useTheme()
  const { setRef, handleKeyDown } = useRovingRadio(THEME_PREFERENCE_OPTIONS, onChange)

  return (
    <MenuGroup title={title}>
      <html.div role='radiogroup' style={styles.options}>
        {THEME_PREFERENCE_OPTIONS.map((option, index) => {
          const selected = option === value
          const { start, end } = PREVIEW_PALETTES[option]

          return (
            <html.div
              key={option}
              aria-checked={selected}
              onClick={() => onChange(option)}
              onKeyDown={(event) => handleKeyDown(event as TileKeyboardEvent, index)}
              ref={setRef(index)}
              role='radio'
              style={[styles.tile, selected && styles.tileSelected]}
              tabIndex={selected ? 0 : -1}
            >
              <html.div style={styles.preview}>
                {end ? (
                  <>
                    <html.div style={styles.half}>
                      <html.div style={styles.halfStart}>
                        <AppearanceWindow colors={start} />
                      </html.div>
                    </html.div>
                    <html.div style={styles.half}>
                      <html.div style={styles.halfEnd}>
                        <AppearanceWindow colors={end} />
                      </html.div>
                    </html.div>
                  </>
                ) : (
                  <AppearanceWindow colors={start} />
                )}
              </html.div>
              <html.div style={styles.labelRow}>
                <html.p style={styles.label}>{labels[option]}</html.p>
                {selected ? (
                  <html.div style={styles.check}>
                    <CheckIcon size={15} color={theme.colors.colorTextPrimary} />
                  </html.div>
                ) : null}
              </html.div>
            </html.div>
          )
        })}
      </html.div>
    </MenuGroup>
  )
}
