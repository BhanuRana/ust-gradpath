/**
 * The card for the selected course: where it sits on the map, whether you can take it, a
 * glance at its description, and actions.
 */
import { Ionicons } from "@expo/vector-icons"
import type { ComponentProps } from "react"
import { Pressable, StyleSheet, View } from "react-native"

import { Text } from "@/components/ui/text"
import { getCourse, getCourseVersion } from "@/data/catalog"
import type { MapNode } from "@/data/prereq/map"
import { count } from "@/lib/format"
import { colors, spacing } from "@/theme"

export type VerdictTone = "done" | "ok" | "warn" | "muted"

export interface MapCardProps {
  code: string
  node: MapNode
  /** Where it sits relative to the map's course, e.g. "Direct prerequisite of COMP 3711". */
  relation: string
  isFocus: boolean
  completed: boolean
  starred: boolean
  step?: number
  loop: boolean
  /** Courses it leads to, for courses on the right-hand side (undefined elsewhere). */
  leads?: number
  term?: number
  /** Whether the student can take it, in words, with a tone for colour. */
  verdict: { tone: VerdictTone; text: string }
  onToggleCompleted: () => void
  onOpen: () => void
  onCentre: () => void
  onClose: () => void
}

const VERDICT = {
  done: { icon: "checkmark-circle", fg: colors.success, bg: colors.successSoft },
  ok: { icon: "checkmark-circle-outline", fg: colors.success, bg: colors.successSoft },
  warn: { icon: "alert-circle", fg: colors.warning, bg: colors.warningSoft },
  muted: { icon: "information-circle-outline", fg: colors.textDim, bg: colors.surfaceAlt },
} as const

type Fact = { icon: ComponentProps<typeof Ionicons>["name"]; color: string; text: string }

export function MapCard(props: MapCardProps) {
  const { code, node, isFocus, completed, starred, step, loop, leads, onOpen, onCentre } = props
  const { onClose, relation, term, verdict, onToggleCompleted } = props
  const course = getCourse(code)
  // A glance at what the course is about; the full page is one tap away.
  const description = getCourseVersion(code, term)?.description
  const tone = VERDICT[verdict.tone]
  const candidates: (Fact | false | 0 | undefined)[] = [
    starred && { icon: "star", color: colors.star, text: "Starred" },
    step && { icon: "trail-sign-outline", color: colors.tint, text: `Step ${step} of your path` },
    node.otherRequirements && {
      icon: "alert-circle-outline",
      color: colors.warning,
      text: "Also has requirements that aren't courses",
    },
    loop && { icon: "sync-outline", color: colors.warning, text: "Part of a prerequisite loop" },
    leads !== undefined && {
      icon: "arrow-forward-circle-outline",
      color: colors.tint,
      text: leads ? `Leads to ${count(leads, "course")}` : "Doesn't lead to any other course",
    },
  ]
  const facts = candidates.filter((f): f is Fact => !!f)

  return (
    <View style={styles.card} testID="map-selected">
      <View style={styles.top}>
        <View style={styles.flex}>
          <Text weight="bold" style={styles.tint}>
            {code}
          </Text>
          <Text size="xs" numberOfLines={2} style={styles.dim}>
            {course?.title ?? "Not in the catalogue"}
          </Text>
          <View style={styles.relation}>
            <Ionicons name="git-commit-outline" size={14} color={colors.tint} />
            <Text size="xxs" weight="medium" style={styles.tint}>
              {relation}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          hitSlop={10}
        >
          <Ionicons name="close" size={20} color={colors.textDim} />
        </Pressable>
      </View>

      <View style={[styles.verdict, { backgroundColor: tone.bg }]} testID="map-verdict">
        <Ionicons name={tone.icon} size={16} color={tone.fg} />
        <Text size="xxs" weight="medium" style={styles.flex}>
          {verdict.text}
        </Text>
        {course && (
          <Pressable
            accessibilityRole="button"
            testID="map-toggle-completed"
            onPress={onToggleCompleted}
            hitSlop={8}
          >
            <Text size="xxs" weight="semiBold" style={styles.tint}>
              {completed ? "Completed · Undo" : "Mark completed"}
            </Text>
          </Pressable>
        )}
      </View>

      {!!description && (
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Open course"
          onPress={onOpen}
          testID="map-description"
        >
          <Text size="xxs" numberOfLines={2} style={styles.preview}>
            {description}
          </Text>
        </Pressable>
      )}

      {facts.length > 0 && (
        <View style={styles.facts}>
          {facts.map((f) => (
            <View key={f.text} style={styles.fact}>
              <Ionicons name={f.icon} size={14} color={f.color} />
              <Text size="xxs" style={styles.dim}>
                {f.text}
              </Text>
            </View>
          ))}
        </View>
      )}

      {course && (
        <View style={styles.buttons}>
          <Pressable
            accessibilityRole="button"
            testID="map-open-course"
            onPress={onOpen}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <Text size="xs" weight="semiBold" style={styles.onTint}>
              Open course
            </Text>
          </Pressable>
          {!isFocus && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Centre map here"
              testID="map-centre"
              onPress={onCentre}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            >
              <Ionicons name="locate-outline" size={15} color={colors.tint} />
              <Text size="xs" weight="semiBold" style={styles.tint}>
                Centre map here
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.75 },
  dim: { color: colors.textDim },
  tint: { color: colors.tint },
  onTint: { color: colors.white },
  card: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  top: { flexDirection: "row", gap: 10 },
  relation: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  verdict: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  preview: { lineHeight: 18 },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  fact: { flexDirection: "row", alignItems: "center", gap: 4 },
  buttons: { flexDirection: "row", gap: spacing.xs },
  primary: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint,
  },
  secondary: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.tint,
  },
})
