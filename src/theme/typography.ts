import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk"

/** Loaded once by the root layout, before the splash screen hides. */
export const fontAssets = {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
}

export const fonts = {
  normal: "SpaceGrotesk_400Regular",
  medium: "SpaceGrotesk_500Medium",
  semiBold: "SpaceGrotesk_600SemiBold",
  bold: "SpaceGrotesk_700Bold",
} as const

export type FontWeight = keyof typeof fonts

export const fontSizes = {
  xxs: { fontSize: 12, lineHeight: 18 },
  xs: { fontSize: 14, lineHeight: 21 },
  sm: { fontSize: 16, lineHeight: 24 },
  md: { fontSize: 18, lineHeight: 26 },
  lg: { fontSize: 20, lineHeight: 30 },
  xl: { fontSize: 24, lineHeight: 34 },
  xxl: { fontSize: 36, lineHeight: 44 },
} as const

export type FontSize = keyof typeof fontSizes
