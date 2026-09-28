import { Text as RNText, type TextProps as RNTextProps } from "react-native"

import { colors, fonts, fontSizes, type FontSize, type FontWeight } from "@/theme"

export interface TextProps extends RNTextProps {
  /** Defaults to `sm` (16 pt). */
  size?: FontSize
  weight?: FontWeight
}

/** React Native's Text in the app's typeface, with a size and weight from the type scale. */
export function Text({ size = "sm", weight = "normal", style, ...rest }: TextProps) {
  return (
    <RNText
      style={[fontSizes[size], { fontFamily: fonts[weight], color: colors.text }, style]}
      {...rest}
    />
  )
}
