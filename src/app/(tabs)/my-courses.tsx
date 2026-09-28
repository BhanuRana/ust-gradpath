import { router } from "expo-router"
import { useCallback, useMemo } from "react"
import { SectionList, StyleSheet, View } from "react-native"

import { CourseRow } from "@/components/course/course-row"
import { MyCoursesEmpty } from "@/components/course/my-courses-empty"
import { HeroHeader } from "@/components/hero-header"
import { Text } from "@/components/ui/text"
import { getCourse } from "@/data/catalog"
import type { CourseSummary } from "@/data/types"
import { useCompleted, useSelectedTerm, useStarred } from "@/hooks/use-preferences"
import { openCourse } from "@/lib/navigation"
import { colors, radius, spacing } from "@/theme"

/** Codes are stored, not courses: anything no longer in the catalogue is skipped. */
const toCourses = (codes: ReadonlySet<string>) =>
  [...codes].map(getCourse).filter((c): c is CourseSummary => !!c)

/**
 * Credits of the completed courses. A few courses carry a range ("0-4"); those count at their
 * minimum and the total gets a "+".
 */
function creditsEarned(courses: CourseSummary[]): string {
  let total = 0
  let variable = false
  for (const c of courses) {
    total += parseFloat(c.credits) || 0
    if (c.credits.includes("-")) variable = true
  }
  return `${total}${variable ? "+" : ""}`
}

export default function MyCoursesScreen() {
  const { starred } = useStarred()
  const { completed } = useCompleted()
  const [term] = useSelectedTerm()

  const sections = useMemo(
    () => [
      { key: "starred", title: "Starred", data: toCourses(starred) },
      { key: "completed", title: "Completed", data: toCourses(completed) },
    ],
    [starred, completed],
  )
  const isEmpty = sections.every((s) => s.data.length === 0)
  // In the same order as the lists: what you're aiming for, then what you've done.
  const stats = [
    { label: "Starred", value: String(sections[0].data.length) },
    { label: "Completed", value: String(sections[1].data.length) },
    { label: "Credits earned", value: creditsEarned(sections[1].data) },
  ]
  const onOpen = useCallback((code: string) => openCourse(code, term), [term])

  return (
    <View style={styles.screen}>
      <HeroHeader eyebrow="HKUST" title="My Courses">
        <View style={styles.stats}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={styles.stat}
              accessible
              accessibilityLabel={`${s.value} ${s.label}`}
            >
              <Text size="lg" weight="bold" style={styles.onHero}>
                {s.value}
              </Text>
              <Text size="xxs" style={styles.onHeroDim}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </HeroHeader>
      {isEmpty ? (
        <MyCoursesEmpty onExplore={() => router.navigate("/")} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(c) => c.code}
          renderItem={({ item }) => (
            <CourseRow
              course={item}
              starred={starred.has(item.code)}
              completed={completed.has(item.code)}
              onPress={onOpen}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text size="xs" weight="bold" style={styles.sectionTitle}>
                {section.title.toUpperCase()} · {section.data.length}
              </Text>
            </View>
          )}
          renderSectionFooter={({ section }) =>
            section.data.length === 0 ? (
              <Text size="xs" style={styles.none}>
                None yet
              </Text>
            ) : null
          }
          stickySectionHeadersEnabled
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  onHero: { color: colors.onHero },
  onHeroDim: { color: colors.onHeroDim },
  stats: { flexDirection: "row", gap: spacing.xs },
  stat: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.heroRaised,
  },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: { color: colors.textDim, letterSpacing: 0.8 },
  none: {
    color: colors.textDim,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  list: { paddingBottom: spacing.md },
})
