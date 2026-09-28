import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, View } from "react-native"

import { Text } from "@/components/ui/text"
import { evaluate, missingRequirements } from "@/data/prereq/evaluate"
import type { PrereqNode } from "@/data/types"
import { colors, spacing } from "@/theme"

const TONES = {
  met: { icon: "checkmark-circle", fg: colors.success, bg: colors.successSoft },
  unmet: { icon: "alert-circle", fg: colors.warning, bg: colors.warningSoft },
  unknown: { icon: "help-circle", fg: colors.textDim, bg: colors.surfaceAlt },
} as const

interface EligibilityProps {
  tree: PrereqNode
  completed: ReadonlySet<string>
}

/**
 * Whether the user can take the course, from their completed courses. Only this course's
 * direct prerequisites are evaluated, so it's cheap on every render.
 */
export function Eligibility({ tree, completed }: EligibilityProps) {
  if (completed.size === 0) {
    return (
      <Text size="xs" style={styles.dim}>
        Mark courses as completed to check whether you can take this one.
      </Text>
    )
  }
  const status = evaluate(tree, completed)
  const tone = TONES[status]
  const message =
    status === "met"
      ? "You meet the prerequisites"
      : status === "unmet"
        ? `Still needed: ${missingRequirements(tree, completed).join(", ")}`
        : "Course prerequisites met; check the other requirements below"

  return (
    <View
      style={[styles.banner, { backgroundColor: tone.bg }]}
      accessibilityRole="summary"
      testID={`eligibility-${status}`}
    >
      <Ionicons name={tone.icon} size={20} color={tone.fg} />
      <Text size="xs" weight="medium" style={styles.flex}>
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dim: { color: colors.textDim },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
})
