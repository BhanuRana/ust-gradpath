import { StyleSheet, View, type ViewStyle } from "react-native"

import { colors, spacing } from "@/theme"

import { Button } from "./button"
import { Text } from "./text"

interface EmptyStateProps {
  heading: string
  content?: string
  action?: { label: string; onPress: () => void }
  style?: ViewStyle
}

export function EmptyState({ heading, content, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text size="lg" weight="semiBold" style={styles.center}>
        {heading}
      </Text>
      {content && (
        <Text size="xs" style={[styles.center, styles.dim]}>
          {content}
        </Text>
      )}
      {action && <Button label={action.label} onPress={action.onPress} variant="secondary" />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: spacing.sm, padding: spacing.lg },
  center: { textAlign: "center" },
  dim: { color: colors.textDim },
})
