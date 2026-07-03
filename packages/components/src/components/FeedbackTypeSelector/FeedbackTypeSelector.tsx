import { css, html } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

const TYPES = ['bug', 'feature', 'general'] as const
export type FeedbackType = (typeof TYPES)[number]
export { TYPES as FEEDBACK_TYPES }

interface FeedbackTypeSelectorProps {
  value: FeedbackType
  onChange: (type: FeedbackType) => void
  labels: Record<FeedbackType, string>
  disabled?: boolean
}

const styles = css.create({
  track: {
    display: 'flex',
    flexDirection: 'row',
    gap: 2,
    backgroundColor: tokens.colorBackgroundSubtle,
    borderRadius: tokens.radiusMd,
    padding: 4
  },
  chip: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    borderRadius: tokens.radiusSm,
    borderWidth: 0,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 8,
    paddingRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease'
  },
  chipDefault: {
    backgroundColor: 'transparent'
  },
  chipSelected: {
    backgroundColor: tokens.colorSurfacePrimary
  },
  chipDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none'
  },
  label: {
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightMedium,
    overflow: 'hidden',
    textAlign: 'center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%'
  },
  labelDefault: {
    color: tokens.colorTextSecondary
  },
  labelSelected: {
    color: tokens.colorTextPrimary
  }
})

export function FeedbackTypeSelector({
  value,
  onChange,
  labels,
  disabled
}: FeedbackTypeSelectorProps) {
  return (
    <html.div style={styles.track}>
      {TYPES.map((t) => {
        const selected = value === t
        return (
          <html.button
            key={t}
            disabled={disabled}
            onClick={() => onChange(t)}
            style={[
              styles.chip,
              selected ? styles.chipSelected : styles.chipDefault,
              disabled ? styles.chipDisabled : null
            ]}
          >
            <html.span
              style={[styles.label, selected ? styles.labelSelected : styles.labelDefault]}
            >
              {labels[t]}
            </html.span>
          </html.button>
        )
      })}
    </html.div>
  )
}
