export interface ThemeColors {
  colorBackground: string
  colorBackgroundDeep: string
  colorBackgroundSubtle: string
  colorSurfacePrimary: string
  colorSurfaceSecondary: string
  colorSurfaceTertiary: string
  colorSurfaceHover: string
  colorSurfaceAccent: string
  colorBorderPrimary: string
  colorBorderStrong: string
  colorTextPrimary: string
  colorTextSecondary: string
  colorTextMuted: string
  colorTextFaint: string
  colorAccent: string
  colorAccentHover: string
  colorAccentActive: string
  colorOnAccent: string
  colorSuccess: string
  colorSuccessSubtle: string
  colorWarning: string
  colorWarningSubtle: string
  colorDanger: string
  colorDangerSubtle: string
  colorInfo: string
  colorInfoSubtle: string
  colorAccentSubtle: string
  colorScrim: string
  colorShadow: string
  colorHighlight: string
  colorOverlaySelected: string
  colorOverlayHover: string
  colorFocusRing: string
}

export interface Theme {
  colors: ThemeColors
}

export enum ThemeType {
  Dark = 'dark',
  Light = 'light'
}
