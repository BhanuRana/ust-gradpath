import { Ionicons } from "@expo/vector-icons"
import { memo } from "react"
import { Pressable, StyleSheet, type TextStyle, View } from "react-native"

import { Text, type TextProps } from "@/components/ui/text"
import type { CourseSummary } from "@/data/types"
import { card, colors, spacing } from "@/theme"

import { DeptBadge } from "./dept-badge"
import { highlightCode, highlightWords, type Segment } from "./highlight"

const CARD_HEIGHT = 72
const GAP = 8
/**
 * Fixed, so FlatList can use getItemLayout and skip measuring ~4,000 rows: the card plus the
 * gap below it. The title is one line (the full title is in the accessibility label and on the
 * course page) and font scaling is capped, so the content always fits.
 */
export const COURSE_ROW_HEIGHT = CARD_HEIGHT + GAP
const MAX_FONT_SCALE = 1.3

interface CourseRowProps {
  course: CourseSummary
  starred?: boolean
  completed?: boolean
  /** The current search, to highlight what matched. */
  query?: string
  onPress?: (code: string) => void
}

/**
 * One course in a list. Memoised and given a stable `onPress`, so typing in the search box
 * only re-renders rows whose props changed.
 */
export const CourseRow = memo(function CourseRow({
  course,
  starred,
  completed,
  query = "",
  onPress,
}: CourseRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        course.code,
        course.title,
        `${course.credits} credits`,
        completed && "completed",
        starred && "starred",
      ]
        .filter(Boolean)
        .join(", ")}
      onPress={() => onPress?.(course.code)}
      testID={`course-row-${course.code}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <DeptBadge prefix={course.prefix} />
      <View style={styles.main}>
        <View style={styles.topLine}>
          <Highlighted
            segments={highlightCode(course.code, query)}
            weight="bold"
            matchStyle={styles.codeMatch}
          />
          {completed && <Ionicons name="checkmark-circle" size={15} color={colors.success} />}
          {starred && <Ionicons name="star" size={13} color={colors.star} />}
        </View>
        <Highlighted
          segments={highlightWords(course.title, query)}
          size="xs"
          style={styles.title}
          matchStyle={styles.titleMatch}
        />
      </View>
      <View style={styles.pill}>
        <Text
          size="xxs"
          weight="medium"
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={styles.pillText}
        >
          {course.credits} cr · {course.career}
        </Text>
      </View>
    </Pressable>
  )
})

type HighlightedProps = { segments: Segment[]; matchStyle: TextStyle } & Pick<
  TextProps,
  "size" | "weight" | "style"
>

/** One line of text with the matched runs emphasised. */
function Highlighted({ segments, matchStyle, ...textProps }: HighlightedProps) {
  return (
    <Text numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE} {...textProps}>
      {segments.map((s, i) =>
        s.match ? (
          <Text key={i} size={textProps.size} weight="bold" style={matchStyle}>
            {s.text}
          </Text>
        ) : (
          s.text
        ),
      )}
    </Text>
  )
}

const styles = StyleSheet.create({
  row: {
    ...card,
    height: CARD_HEIGHT,
    marginBottom: GAP,
    marginHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  main: { flex: 1 },
  topLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  codeMatch: { color: colors.tint },
  title: { color: colors.textDim },
  titleMatch: { color: colors.text },
  pill: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  pillText: { color: colors.textDim },
})
