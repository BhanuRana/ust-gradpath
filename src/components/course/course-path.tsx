import { Ionicons } from "@expo/vector-icons"
import { Fragment, type ReactNode } from "react"
import { Pressable, StyleSheet, View } from "react-native"

import { Text } from "@/components/ui/text"
import { getCourse, getIndex } from "@/data/catalog"
import type { CoursePath as Path, PathCourse } from "@/data/prereq/plan"
import { colors, spacing } from "@/theme"

interface CoursePathProps {
  path: Path
  /** The course the path leads to. */
  target: string
  starred: ReadonlySet<string>
  /** Whether the user has marked anything completed (if not, suggest it). */
  hasCompleted: boolean
  onOpenCourse: (code: string) => void
  onStarAll: (codes: string[]) => void
}

const SEASON_ORDER = ["Fall", "Winter", "Spring", "Summer"]

/**
 * "Fall · Spring": the seasons a course runs in, from the terms in the dataset. Only shown
 * when that narrows things down; a course offered in every term gets nothing.
 */
function seasonsOf(code: string): string | undefined {
  const course = getCourse(code)
  if (!course) return undefined
  const { terms } = getIndex()
  const season = (t: number) => terms[t].name.split(" ").pop()
  const seasons = new Set(course.terms.map(season))
  if (seasons.size === new Set(terms.map((_, i) => season(i))).size) return undefined
  return SEASON_ORDER.filter((s) => seasons.has(s)).join(" · ")
}

/**
 * The courses still to take before `target`, as a numbered timeline ending at the target,
 * with a button to star all of them.
 */
export function CoursePath(props: CoursePathProps) {
  const { path, target, starred, hasCompleted, onOpenCourse, onStarAll } = props
  const all = [...path.steps.flat().map((c) => c.code), target].filter((c) => getCourse(c))
  const allStarred = all.every((c) => starred.has(c))
  const starLabel = allStarred ? "Whole path starred" : "Star the whole path"

  return (
    <View>
      {path.completedUsed.length > 0 && (
        <View style={styles.counting}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text size="xxs" style={[styles.dim, styles.flex]}>
            Counting {path.completedUsed.join(", ")}, which you&apos;ve completed.
          </Text>
        </View>
      )}

      {path.steps.map((courses, i) => (
        <Fragment key={i}>
          <StepHeader
            marker={
              <Text size="xxs" weight="bold" style={[styles.markerText, i === 0 && styles.onTint]}>
                {i + 1}
              </Text>
            }
            filled={i === 0}
            label={`Step ${i + 1}`}
            note={i === 0 ? "Can take now" : undefined}
          />
          <View style={styles.stepBody}>
            <View style={styles.rail} />
            <View style={styles.courses}>
              {courses.map((c) => (
                <PathRow
                  key={c.code}
                  course={c}
                  starred={starred.has(c.code)}
                  onPress={onOpenCourse}
                />
              ))}
            </View>
          </View>
        </Fragment>
      ))}

      <StepHeader
        marker={<Ionicons name="flag" size={13} color={colors.white} />}
        filled
        goal
        label={target}
        note="Your goal"
      />
      {path.targetOtherRequirements && (
        <Text size="xxs" style={[styles.other, styles.goalTag]}>
          + other requirements
        </Text>
      )}
      {path.loops && (
        <Text size="xxs" style={[styles.dim, styles.footnote]}>
          Some of these prerequisites loop back on each other; the loop is left out.
        </Text>
      )}
      {!hasCompleted && (
        <Text size="xxs" style={[styles.dim, styles.footnote]}>
          Mark courses you&apos;ve completed to shorten this.
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={starLabel}
        accessibilityState={{ disabled: allStarred }}
        disabled={allStarred}
        onPress={() => onStarAll(all)}
        testID="star-path"
        style={({ pressed }) => [
          styles.starAll,
          allStarred && styles.starAllDone,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name={allStarred ? "checkmark" : "star-outline"}
          size={17}
          color={allStarred ? colors.textDim : colors.tint}
        />
        <Text size="xs" weight="semiBold" style={allStarred ? styles.dim : styles.tint}>
          {starLabel}
        </Text>
      </Pressable>
    </View>
  )
}

interface StepHeaderProps {
  marker: ReactNode
  filled?: boolean
  goal?: boolean
  label: string
  note?: string
}

/** A timeline node: a round marker with the step's label beside it. */
function StepHeader({ marker, filled, goal, label, note }: StepHeaderProps) {
  return (
    <View style={styles.stepHeader} accessibilityRole="header">
      <View
        style={[
          styles.marker,
          filled ? styles.markerFilled : styles.markerOpen,
          goal && styles.markerGoal,
        ]}
      >
        {marker}
      </View>
      <Text
        size={goal ? "sm" : "xxs"}
        weight={goal ? "bold" : "semiBold"}
        style={goal ? undefined : styles.stepLabel}
      >
        {label}
      </Text>
      {note && (
        <Text size="xxs" style={styles.dim}>
          · {note}
        </Text>
      )}
    </View>
  )
}

interface PathRowProps {
  course: PathCourse
  starred: boolean
  onPress: (code: string) => void
}

/** One course on the path: tap to open it. */
function PathRow({ course, starred, onPress }: PathRowProps) {
  const summary = getCourse(course.code)
  const title = summary?.title ?? "Not in the catalogue"
  const seasons = seasonsOf(course.code)
  const alternatives = course.alternatives.length
    ? `or ${course.alternatives.join(" / ")}`
    : undefined

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[course.code, title, seasons && `Offered ${seasons}`, alternatives]
        .filter(Boolean)
        .join(", ")}
      disabled={!summary}
      onPress={() => onPress(course.code)}
      testID={`path-course-${course.code}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowTop}>
        <Text size="xs" weight="semiBold" style={styles.tint}>
          {course.code}
        </Text>
        {starred && <Ionicons name="star" size={12} color={colors.star} />}
        <View style={styles.flex} />
        {seasons && (
          <Text size="xxs" style={styles.dim}>
            {seasons}
          </Text>
        )}
      </View>
      <Text size="xxs" style={styles.dim} numberOfLines={1}>
        {title}
      </Text>
      {(alternatives || course.otherRequirements) && (
        <View style={styles.rowExtras}>
          {alternatives && (
            <Text size="xxs" style={styles.alternatives}>
              {alternatives}
            </Text>
          )}
          {course.otherRequirements && (
            <Text size="xxs" style={styles.other}>
              + other requirements
            </Text>
          )}
        </View>
      )}
    </Pressable>
  )
}

const MARKER = 24

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  dim: { color: colors.textDim },
  tint: { color: colors.tint },
  onTint: { color: colors.white },
  counting: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  marker: {
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  markerFilled: { backgroundColor: colors.tint, borderColor: colors.tint },
  markerOpen: { backgroundColor: colors.surface, borderColor: colors.tint },
  markerGoal: { backgroundColor: colors.star, borderColor: colors.star },
  markerText: { color: colors.tint, lineHeight: 14 },
  stepLabel: { color: colors.tint, textTransform: "uppercase", letterSpacing: 0.8 },
  // The rail runs down from one marker to the next, beside that step's courses.
  stepBody: { flexDirection: "row" },
  rail: {
    width: 2,
    marginLeft: MARKER / 2 - 1,
    marginRight: MARKER / 2 + 7,
    backgroundColor: colors.tintSoft,
    borderRadius: 1,
  },
  courses: { flex: 1, gap: 6, paddingTop: 6, paddingBottom: 10 },
  row: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    gap: 1,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowExtras: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.xs },
  alternatives: { color: colors.textDim, fontStyle: "italic" },
  other: { color: colors.warning },
  goalTag: { marginLeft: MARKER + spacing.xs, marginTop: 2 },
  footnote: { marginTop: 10 },
  starAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    marginTop: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.tint,
  },
  starAllDone: { borderColor: colors.separator },
})
