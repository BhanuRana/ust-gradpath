import { Ionicons } from "@expo/vector-icons"
import type { ComponentProps } from "react"
import { Pressable, type PressableProps, StyleSheet } from "react-native"

import { colors, radius, spacing } from "@/theme"

import { Text } from "./text"

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  label: string
  icon?: ComponentProps<typeof Ionicons>["name"]
  /** `primary` is filled navy; `secondary` is outlined. */
  variant?: "primary" | "secondary"
}

export function Button({ label, icon, variant = "primary", ...rest }: ButtonProps) {
  const color = variant === "primary" ? colors.white : colors.tint
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, styles[variant], pressed && styles.pressed]}
      {...rest}
    >
      {icon && <Ionicons name={icon} size={17} color={color} />}
      <Text weight="semiBold" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    gap: spacing.xs,
    height: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.tint },
  secondary: { borderWidth: 1.5, borderColor: colors.tint, backgroundColor: colors.surface },
  pressed: { opacity: 0.8 },
})
