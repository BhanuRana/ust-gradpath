import { Ionicons } from "@expo/vector-icons"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import Svg, { Circle, G, Path, Rect } from "react-native-svg"

import { Text } from "@/components/ui/text"
import { colors, radius, spacing } from "@/theme"

/**
 * My Courses before anything is starred or completed: an illustration in the app's own
 * language (course cards, a star, a tick, and a dashed route to a gold node, as in the icon),
 * one line on how to fill the screen, and a way to start.
 */
export function MyCoursesEmpty({ onExplore }: { onExplore: () => void }) {
  return (
    // Centred when it fits; scrolls on a short screen rather than clipping the button.
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      testID="my-courses-empty"
    >
      <Illustration />
      <View style={styles.copy}>
        <Text size="lg" weight="medium" style={styles.center}>
          Your plan starts here
        </Text>
        <Text size="xs" style={[styles.center, styles.dim]}>
          {"Star courses you want and mark the ones you've done to see what you can take next."}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Explore courses"
        testID="empty-explore"
        onPress={onExplore}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="search" size={17} color={colors.white} />
        <Text weight="semiBold" style={styles.onTint}>
          Explore courses
        </Text>
      </Pressable>
    </ScrollView>
  )
}

/** Two course cards (starred, completed) on a soft disc, with a dashed route to a gold node. */
function Illustration() {
  const card = colors.surface
  const line = colors.separator
  return (
    <Svg
      width={240}
      height={170}
      viewBox="0 0 240 170"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Soft disc behind. */}
      <Circle cx={120} cy={88} r={78} fill={colors.tintSoft} />

      {/* Dashed route from the cards to the goal node, as in the app icon. */}
      <Path
        d="M 64 132 C 40 110, 44 70, 78 52"
        stroke={colors.tint}
        strokeWidth={2.5}
        strokeDasharray="5 6"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={80} cy={50} r={8} fill={colors.star} />
      <Circle cx={62} cy={134} r={5} fill={colors.tint} />

      {/* Back card: completed (coral stripe, green tick). */}
      <G transform="rotate(-8 150 70)">
        <Rect
          x={92}
          y={46}
          width={118}
          height={56}
          rx={12}
          fill={card}
          stroke={line}
          strokeWidth={1.5}
        />
        <Rect x={99} y={56} width={5} height={36} rx={2.5} fill="#C2553A" />
        <Rect x={112} y={60} width={46} height={8} rx={4} fill={colors.tint} opacity={0.85} />
        <Rect x={112} y={76} width={74} height={6} rx={3} fill={line} />
        <Rect x={112} y={87} width={52} height={6} rx={3} fill={line} />
        <Circle cx={196} cy={60} r={10} fill={colors.success} />
        <Path
          d="M 191 60 L 195 64 L 202 56"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </G>

      {/* Front card: starred (navy stripe, gold star). */}
      <G transform="rotate(5 130 116)">
        <Rect
          x={72}
          y={92}
          width={124}
          height={58}
          rx={12}
          fill={card}
          stroke={line}
          strokeWidth={1.5}
        />
        <Rect x={79} y={102} width={5} height={38} rx={2.5} fill={colors.tint} />
        <Rect x={92} y={106} width={52} height={8} rx={4} fill={colors.tint} />
        <Rect x={92} y={122} width={80} height={6} rx={3} fill={line} />
        <Rect x={92} y={133} width={56} height={6} rx={3} fill={line} />
        <Path
          d="M 180 98 L 183.5 105.2 L 191.4 106.3 L 185.7 111.8 L 187.1 119.7 L 180 116 L 172.9 119.7 L 174.3 111.8 L 168.6 106.3 L 176.5 105.2 Z"
          fill={colors.star}
        />
      </G>
    </Svg>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  copy: { gap: 6, alignItems: "center" },
  center: { textAlign: "center" },
  dim: { color: colors.textDim },
  onTint: { color: colors.white },
  pressed: { opacity: 0.8 },
  button: {
    flexDirection: "row",
    gap: spacing.xs,
    alignSelf: "stretch",
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint,
  },
})
