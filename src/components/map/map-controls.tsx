import { Ionicons } from "@expo/vector-icons"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"

import { Text } from "@/components/ui/text"
import { colors } from "@/theme"

interface MapControlsProps {
  /** There's a "Your path" to highlight. */
  hasPath: boolean
  showPath: boolean
  onTogglePath: () => void
  /** The explored route (the course, then each expanded one); empty when nothing's expanded. */
  route: string[]
  /** Go back to the course at this index of the route. */
  onRoute: (index: number) => void
}

/**
 * The map's top row: the "My path" switch and the explored route as a breadcrumb, on the same
 * centre line as the zoom buttons.
 */
export function MapControls({ hasPath, showPath, onTogglePath, route, onRoute }: MapControlsProps) {
  return (
    <View style={styles.controls} pointerEvents="box-none">
      {hasPath && (
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="My path"
          accessibilityState={{ checked: showPath }}
          testID="map-path-toggle"
          onPress={onTogglePath}
          style={[styles.pathToggle, showPath && styles.pathToggleOn]}
        >
          <Ionicons
            name="trail-sign-outline"
            size={14}
            color={showPath ? colors.white : colors.tint}
          />
          <Text size="xxs" weight="semiBold" style={showPath ? styles.onTint : styles.tint}>
            My path
          </Text>
        </Pressable>
      )}
      {route.length > 0 && (
        <ScrollView
          horizontal
          style={styles.crumbScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.crumbs}
          accessibilityLabel="Explored path"
        >
          {route.map((id, i) => {
            const last = i === route.length - 1
            return (
              <View key={id} style={styles.crumbItem}>
                {i > 0 && <Ionicons name="chevron-forward" size={12} color={colors.textDim} />}
                <Pressable
                  accessibilityRole="button"
                  testID={`map-crumb-${id}`}
                  onPress={() => onRoute(i)}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.crumb,
                    last && styles.crumbLast,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text size="xxs" weight="semiBold" style={last ? styles.onTint : styles.tint}>
                    {id}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  tint: { color: colors.tint },
  onTint: { color: colors.white },
  // Top-left, leaving room for the fit and zoom buttons on the right. The height matches
  // theirs, so everything in the top row shares one centre line.
  controls: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 64,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pathToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.tint,
    backgroundColor: colors.surface,
  },
  pathToggleOn: { backgroundColor: colors.tint },
  crumbScroll: { flexGrow: 0, flexShrink: 1 },
  crumbs: { alignItems: "center", gap: 4 },
  crumbItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  crumb: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.tint,
  },
  crumbLast: { backgroundColor: colors.tint },
})
