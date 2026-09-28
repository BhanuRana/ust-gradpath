import { Ionicons } from "@expo/vector-icons"
import type { ComponentProps, ReactNode } from "react"
import { StyleSheet, View } from "react-native"

import { Text } from "@/components/ui/text"
import { card, colors, spacing } from "@/theme"

interface SectionProps {
  icon: ComponentProps<typeof Ionicons>["name"]
  title: string
  subtitle?: string
  children: ReactNode
}

/** A titled card on the course page. */
export function Section({ icon, title, subtitle, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name={icon} size={15} color={colors.tint} />
        </View>
        <View style={styles.flex}>
          <Text weight="bold">{title}</Text>
          {subtitle && (
            <Text size="xxs" style={styles.dim}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dim: { color: colors.textDim },
  section: { ...card, marginTop: spacing.sm, marginHorizontal: spacing.md, padding: spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tintSoft,
  },
  body: { marginTop: spacing.sm, gap: 6 },
})
