import { Ionicons } from "@expo/vector-icons"
import type { ComponentProps } from "react"
import { Pressable, type PressableProps, StyleSheet } from "react-native"

import { colors, spacing } from "@/theme"

import { Text } from "./text"

interface ChipProps extends Omit<PressableProps, "children" | "style"> {
  label: string
  selected?: boolean
  /** Trailing icon, e.g. a cross on a removable filter. */
  icon?: ComponentProps<typeof Ionicons>["name"]
  /** Dimmed and dashed, e.g. a term the course isn't offered in. */
  muted?: boolean
}

/** A small rounded toggle, for filters and terms. */
export function Chip({ label, selected, icon, muted, ...rest }: ChipProps) {
  const color = selected ? colors.white : muted ? colors.textDim : colors.text
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected, disabled: !!rest.disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        muted && styles.muted,
        pressed && styles.pressed,
      ]}
      {...rest}
    >
      <Text size="xs" weight="medium" style={[styles.label, { color }]}>
        {label}
      </Text>
      {icon && <Ionicons name={icon} size={14} color={color} />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.separator,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.tint, borderColor: colors.tint },
  muted: { borderStyle: "dashed", backgroundColor: "transparent" },
  pressed: { opacity: 0.7 },
  label: { lineHeight: 18 },
})
