import React, { createContext, useContext, useMemo } from 'react'
import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native'

/* Design tokens taken from the website's styles.css (:root and dark-mode overrides). */
export const light = {
  gold: '#c9a227', navy: '#163965', navy2: '#0f2a4d', accent: '#1f5fbf',
  bg: '#f3f5f9', card: '#ffffff', ink: '#1b2433', mute: '#66728a', line: '#dfe4ee',
  pos: '#1f7a4d', neg: '#b3382c', side: '#163965', sidetx: '#dbe4f3',
  /* text colour used for headings (navy on light, light-blue on dark, as the site does) */
  heading: '#163965', onPrimary: '#ffffff', primary: '#0f2a4d', tag: '#eaf1fb', tagText: '#163965',
  overlay: 'rgba(15,42,77,0.45)', header: '#0f2a4d', isDark: false
}
export const dark: typeof light = {
  ...light,
  bg: '#0c1524', card: '#14223a', ink: '#e8edf6', mute: '#93a1ba', line: '#243452',
  side: '#0a1220', navy: '#9fbbe6', heading: '#9fbbe6', pos: '#4cc58a', neg: '#ef7d70',
  primary: '#1f5fbf', tag: '#1c2f4f', tagText: '#c9d8f0', header: '#0a1220', isDark: true
}
export type Colors = typeof light

export const fonts = {
  serif: 'CormorantGaramond_600SemiBold',
  serifBold: 'CormorantGaramond_700Bold',
  sans: 'Manrope_400Regular',
  sansMed: 'Manrope_500Medium',
  sansSemi: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold'
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 }

const ThemeCtx = createContext<Colors>(light)
/* The app is light-only: the phone's dark-mode setting is ignored. */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeCtx.Provider value={light}>{children}</ThemeCtx.Provider>
)
export const useTheme = () => useContext(ThemeCtx)

/** Build a StyleSheet from the current palette, memoised per palette. */
type Style = ViewStyle | TextStyle | ImageStyle
export function useStyles<T extends Record<string, Style>>(factory: (c: Colors) => T): T {
  const c = useTheme()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(c)), [c])
}
