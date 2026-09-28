/**
 * The map's nodes: course cards (with status, step and "leads to" badges) and the small
 * junctions where "one of" / "all of" groups meet. Both fade in and out with their column and
 * dim with the selection.
 */
import { Ionicons } from "@expo/vector-icons"
import { memo, useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { Text } from "@/components/ui/text"
import { getCourse } from "@/data/catalog"
import type { CourseStatus } from "@/data/prereq/evaluate"
import type { MapNode } from "@/data/prereq/map"
import { colors, departmentColor } from "@/theme"

import type { Box } from "./edge-geometry"

const DIMMED = 0.22
/** New columns fade in; collapsed ones fade out. */
const NODE_IN = FadeIn.duration(260)
const NODE_OUT = FadeOut.duration(160)

/** Fades a node down when it's outside the selected course's lineage, and back up. */
function useDimStyle(dim: boolean) {
  const opacity = useSharedValue(dim ? DIMMED : 1)
  useEffect(() => {
    opacity.value = withTiming(dim ? DIMMED : 1, { duration: 220 })
  }, [dim, opacity])
  return useAnimatedStyle(() => ({ opacity: opacity.value }))
}

interface CourseNodeProps {
  node: MapNode
  rect: Box
  isFocus: boolean
  isSelected: boolean
  completed: boolean
  starred: boolean
  /** Its step on "Your path", when the path is shown. */
  step?: number
  onPathRing: boolean
  /** How many courses tapping it would expand into view (0 when it wouldn't). */
  leads: number
  /** Whether the student can take it; shown once anything is marked completed. */
  status?: CourseStatus
  dim: boolean
  onSelect: (id: string) => void
}

export const CourseNode = memo(function CourseNode(props: CourseNodeProps) {
  const { node, rect, isFocus, isSelected, completed, starred, step, onPathRing, dim } = props
  const { leads, status, onSelect } = props
  const canTake = status?.kind === "can-take" && !isFocus
  const course = getCourse(node.id)
  const title = course?.title ?? "Not in the catalogue"
  const statusText = [
    completed && "Completed",
    starred && "Starred",
    step && `Step ${step} of your path`,
  ]
    .filter(Boolean)
    .join(", ")
  const dimStyle = useDimStyle(dim)

  // Two layers: the outer fades in and out with the column, the inner dims with the
  // selection. Both animate opacity, so they can't share a view.
  return (
    <Animated.View
      entering={NODE_IN}
      exiting={NODE_OUT}
      style={[styles.place, { left: rect.x, top: rect.y, width: rect.w, height: rect.h }]}
      accessible
      accessibilityRole="button"
      accessibilityLabel={[`${node.id}, ${title}`, statusText].filter(Boolean).join(", ")}
      accessibilityState={{ selected: isSelected }}
      onAccessibilityTap={() => onSelect(node.id)}
      testID={`map-node-${node.id}`}
    >
      <Animated.View
        style={[
          styles.node,
          !course && styles.nodeMissing,
          completed && !isFocus && styles.nodeCompleted,
          canTake && styles.nodeCanTake,
          onPathRing && !completed && styles.nodeOnPath,
          isFocus && styles.nodeFocus,
          isSelected && styles.nodeSelected,
          dimStyle,
        ]}
      >
        {!isFocus && (
          <View
            style={[styles.stripe, { backgroundColor: departmentColor(node.id.split(" ")[0]).fg }]}
          />
        )}
        <View style={styles.body}>
          <View style={styles.top}>
            <Text weight="bold" style={[styles.code, isFocus && styles.onFocus]}>
              {node.id}
            </Text>
            {completed && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={isFocus ? colors.white : colors.success}
              />
            )}
            {starred && <Ionicons name="star" size={20} color={colors.star} />}
            {node.otherRequirements && (
              <Text style={[styles.extra, isFocus && styles.onFocus]}>+</Text>
            )}
          </View>
          <Text numberOfLines={1} style={[styles.title, isFocus && styles.onFocus]}>
            {title}
          </Text>
        </View>
        {step !== undefined && (
          <View style={styles.stepBadge}>
            <Text weight="bold" style={styles.badgeText}>
              {step}
            </Text>
          </View>
        )}
        {status && status.kind !== "completed" && (
          <View
            style={[
              styles.statusTag,
              status.kind === "can-take" && styles.statusOk,
              status.kind === "needs" && styles.statusWarn,
            ]}
          >
            <Text weight="bold" style={styles.statusText}>
              {status.kind === "can-take"
                ? "CAN TAKE"
                : status.kind === "needs"
                  ? `NEEDS ${status.missing}`
                  : "?"}
            </Text>
          </View>
        )}
        {leads > 0 && (
          <View style={styles.leadsBadge} accessibilityLabel={`Leads to ${leads} more`}>
            <Ionicons name="arrow-forward" size={14} color={colors.white} />
            <Text weight="bold" style={styles.badgeText}>
              {leads}
            </Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  )
})

interface JunctionProps {
  node: MapNode
  rect: Box
  dim: boolean
  /** How many options feed it. */
  options: number
  /** The group is satisfied by completed courses. */
  met: boolean
}

export function Junction({ node, rect, dim, options, met }: JunctionProps) {
  const dimStyle = useDimStyle(dim)
  return (
    <Animated.View
      entering={NODE_IN}
      exiting={NODE_OUT}
      style={[styles.place, { left: rect.x, top: rect.y, width: rect.w, height: rect.h }]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.junction, met && styles.junctionMet, dimStyle]}>
        <Text weight="bold" style={[styles.junctionText, met && styles.junctionTextMet]}>
          {node.kind === "any" ? "ONE OF" : "ALL OF"} {options}
          {met ? " ✓" : ""}
        </Text>
      </Animated.View>
    </Animated.View>
  )
}

// Sizes are for the map's drawing scale, where nodes are drawn large and scaled down.
const styles = StyleSheet.create({
  place: { position: "absolute" },
  node: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.separator,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  nodeFocus: {
    backgroundColor: colors.tint,
    borderColor: colors.tint,
    shadowColor: colors.tint,
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  nodeCompleted: { borderColor: colors.success, borderWidth: 2.5 },
  nodeCanTake: { borderColor: colors.success, borderWidth: 2.5, borderStyle: "dashed" },
  nodeOnPath: { borderColor: colors.tint, borderWidth: 3 },
  nodeSelected: {
    borderColor: colors.star,
    borderWidth: 4,
    shadowColor: colors.star,
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  nodeMissing: {
    borderStyle: "dashed",
    borderColor: colors.textDim,
    backgroundColor: "transparent",
  },
  stripe: { width: 7, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  body: { flex: 1, justifyContent: "center", paddingHorizontal: 14 },
  top: { flexDirection: "row", alignItems: "center", gap: 6 },
  code: { fontSize: 22, lineHeight: 30, color: colors.tint },
  title: { fontSize: 16, lineHeight: 22, color: colors.textDim },
  extra: { fontSize: 20, lineHeight: 26, fontWeight: "700", color: colors.warning },
  onFocus: { color: colors.white },
  stepBadge: {
    position: "absolute",
    top: -14,
    left: -14,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint,
    borderWidth: 3,
    borderColor: colors.background,
  },
  badgeText: { color: colors.white, fontSize: 14, lineHeight: 18 },
  statusTag: {
    position: "absolute",
    top: -14,
    right: 16,
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.textDim,
    borderWidth: 3,
    borderColor: colors.background,
  },
  statusOk: { backgroundColor: colors.success },
  statusWarn: { backgroundColor: colors.warning },
  statusText: { color: colors.white, fontSize: 12, lineHeight: 15, letterSpacing: 0.6 },
  leadsBadge: {
    position: "absolute",
    right: -18,
    top: "50%",
    marginTop: -15,
    height: 30,
    minWidth: 44,
    paddingHorizontal: 8,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: colors.tint,
    borderWidth: 3,
    borderColor: colors.background,
  },
  junction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.tint,
  },
  junctionMet: { borderColor: colors.success, backgroundColor: colors.successSoft },
  junctionText: { color: colors.tint, fontSize: 13, lineHeight: 16, letterSpacing: 0.8 },
  junctionTextMet: { color: colors.success },
})
