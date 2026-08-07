import {
  SYSTEM_THEME_PREFERENCE,
  THEME_PREFERENCE_OPTIONS,
  ThemeType,
  useTheme,
  type ThemePreference
} from '@altersend/components'
import { MonitorIcon, MoonIcon, SunIcon, type IconComponent } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'

const OPTION_ICONS: Record<ThemePreference, IconComponent> = {
  [ThemeType.Light]: SunIcon,
  [ThemeType.Dark]: MoonIcon,
  [SYSTEM_THEME_PREFERENCE]: MonitorIcon
}

export function AppearanceToggle() {
  const { t } = useTranslation(['settings'])
  const { theme, themePreference, setThemePreference } = useTheme()

  const labels = {
    [ThemeType.Light]: t('settings:appearance.light'),
    [ThemeType.Dark]: t('settings:appearance.dark'),
    [SYSTEM_THEME_PREFERENCE]: t('settings:appearance.system')
  }

  return (
    <div
      role='radiogroup'
      aria-label={t('settings:appearance.title')}
      className='inline-flex items-center gap-0.5 rounded-xl border border-border-primary bg-background-subtle p-1'
    >
      {THEME_PREFERENCE_OPTIONS.map((option) => {
        const Icon = OPTION_ICONS[option]
        const selected = option === themePreference

        return (
          <button
            key={option}
            type='button'
            role='radio'
            aria-checked={selected}
            aria-label={labels[option]}
            title={labels[option]}
            tabIndex={selected ? 0 : -1}
            onClick={() => setThemePreference(option)}
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
              selected ? 'bg-surface-secondary' : 'bg-transparent'
            }`}
          >
            <Icon
              size={15}
              color={selected ? theme.colors.colorTextPrimary : theme.colors.colorTextMuted}
            />
          </button>
        )
      })}
    </div>
  )
}
