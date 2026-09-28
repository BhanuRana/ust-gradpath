/** The map key: what the colours, tags and lines mean. */
import { Ionicons } from "@expo/vector-icons"
import type { ReactNode } from "react"
import { StyleSheet, View } from "react-native"

import { Text } from "@/components/ui/text"
import { colors, radius, spacing } from "@/theme"

export function MapKey({ showPath }: { showPath: boolean }) {
  return (
    <View style={styles.key}>
      <Text size="xxs" style={[styles.dim, styles.center]}>
        Pinch to zoom · tap a course to explore where it leads
      </Text>
      <View style={styles.row}>
        <Item
          swatch={<View style={[styles.box, { backgroundColor: colors.tint }]} />}
          label="This course"
        />
        <Item
          swatch={<Ionicons name="checkmark-circle" size={14} color={colors.success} />}
          label="Completed"
        />
        <Item
          swatch={<View style={[styles.pill, { backgroundColor: colors.success }]} />}
          label="Can take"
        />
        <Item
          swatch={<View style={[styles.pill, { backgroundColor: colors.warning }]} />}
          label="Still needed"
        />
        <Item swatch={<Ionicons name="star" size={13} color={colors.star} />} label="Starred" />
        {showPath && (
          <Item
            swatch={<View style={[styles.line, { backgroundColor: colors.tint }]} />}
            label="Your path"
          />
        )}
        <Item swatch={<View style={[styles.line, styles.dashed]} />} label="Loop" />
      </View>
    </View>
  )
}

function Item({ swatch, label }: { swatch: ReactNode; label: string }) {
  return (
    <View style={styles.item}>
      {swatch}
      <Text size="xxs" style={styles.dim}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  key: {
    alignSelf: "stretch",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  dim: { color: colors.textDim },
  center: { textAlign: "center" },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: 12,
    rowGap: 4,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 4 },
  pill: { width: 16, height: 9, borderRadius: 5 },
  box: { width: 12, height: 12, borderRadius: 4 },
  line: { width: 18, height: 3, borderRadius: 2 },
  dashed: {
    height: 0,
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.warning,
    backgroundColor: "transparent",
  },
})
