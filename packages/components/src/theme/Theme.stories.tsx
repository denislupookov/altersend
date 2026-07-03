import type { Meta, StoryObj } from '@storybook/react-vite'
import React from 'react'
import { css, html } from 'react-strict-dom'
import { ThemeProvider, ThemeType, useTheme } from './index'

const styles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  },
  hero: {
    padding: 24,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 16,
    gap: 8,
    display: 'flex',
    flexDirection: 'column'
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    fontFamily: '"SFMono-Regular", "JetBrains Mono", monospace',
    textTransform: 'uppercase',
    letterSpacing: '0.12em'
  },
  title: {
    margin: 0,
    fontSize: 32,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, system-ui, sans-serif',
    fontWeight: '700',
    letterSpacing: '-0.03em'
  },
  description: {
    margin: 0,
    fontSize: 16,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, system-ui, sans-serif',
    lineHeight: 1.6
  },
  section: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16
  },
  swatch: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 12
  },
  colorChip: {
    width: '100%',
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid'
  },
  tokenName: {
    margin: 0,
    fontSize: 14,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, system-ui, sans-serif',
    fontWeight: '600'
  },
  tokenValue: {
    margin: 0,
    fontSize: 12,
    fontFamily: '"SFMono-Regular", "JetBrains Mono", monospace'
  }
})

function ThemeOverview() {
  const { theme, themeType } = useTheme()

  const swatches = [
    ['Background', theme.colors.colorBackground],
    ['Surface', theme.colors.colorSurfacePrimary],
    ['Elevated', theme.colors.colorSurfaceSecondary],
    ['Accent', theme.colors.colorAccent],
    ['Text', theme.colors.colorTextPrimary],
    ['Muted', theme.colors.colorTextMuted]
  ] as const

  return (
    <html.div style={styles.root}>
      <html.div
        style={[
          styles.hero,
          {
            borderColor: theme.colors.colorBorderPrimary,
            backgroundColor: theme.colors.colorSurfacePrimary
          }
        ]}
      >
        <html.p style={[styles.eyebrow, { color: theme.colors.colorTextMuted }]}>
          Theme Setup
        </html.p>
        <html.h1 style={[styles.title, { color: theme.colors.colorTextPrimary }]}>
          AlterSend UI foundation
        </html.h1>
        <html.p style={[styles.description, { color: theme.colors.colorTextSecondary }]}>
          React Strict DOM, generated design tokens, and light/dark themes. Current theme:{' '}
          {themeType}.
        </html.p>
      </html.div>

      <html.div style={styles.section}>
        {swatches.map(([label, value]) => (
          <html.div
            key={label}
            style={[
              styles.swatch,
              {
                borderColor: theme.colors.colorBorderPrimary,
                backgroundColor: theme.colors.colorSurfaceSecondary
              }
            ]}
          >
            <html.div
              style={[
                styles.colorChip,
                {
                  borderColor: theme.colors.colorBorderPrimary,
                  backgroundColor: value
                }
              ]}
            />
            <html.p style={[styles.tokenName, { color: theme.colors.colorTextPrimary }]}>
              {label}
            </html.p>
            <html.p style={[styles.tokenValue, { color: theme.colors.colorTextMuted }]}>
              {value}
            </html.p>
          </html.div>
        ))}
      </html.div>
    </html.div>
  )
}

const meta = {
  title: 'Theme/Overview',
  parameters: {
    controls: { disable: true }
  }
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Dark: Story = {
  render: () => (
    <ThemeProvider theme={ThemeType.Dark}>
      <ThemeOverview />
    </ThemeProvider>
  )
}

export const Light: Story = {
  render: () => (
    <ThemeProvider theme={ThemeType.Light}>
      <ThemeOverview />
    </ThemeProvider>
  )
}
