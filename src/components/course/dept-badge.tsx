import { StyleSheet, View } from "react-native"

import { Text } from "@/components/ui/text"
import { departmentColor } from "@/theme"

interface DeptBadgeProps {
  prefix: string
  /** Side length in points. */
  size?: number
}

/** A rounded square in the department's colour, showing its prefix. Hidden from screen readers. */
export function DeptBadge({ prefix, size = 44 }: DeptBadgeProps) {
  const { fg, bg } = departmentColor(prefix)
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size * 0.28, backgroundColor: bg },
      ]}
    >
      <Text
        weight="bold"
        maxFontSizeMultiplier={1}
        style={[styles.label, { color: fg, fontSize: size * 0.25, lineHeight: size * 0.32 }]}
      >
        {prefix}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { alignItems: "center", justifyContent: "center" },
  label: { letterSpacing: 0.3 },
})
