import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { CodeChip } from "@/components/course/code-chip"
import { Eligibility } from "@/components/course/eligibility"
import { LinkedCodesText } from "@/components/course/linked-codes-text"
import { PrereqTree } from "@/components/course/prereq-tree"
import { PrerequisitePrompt } from "@/components/course/prerequisite-prompt"
import { Section } from "@/components/course/section"
import { HeroButton, HeroHeader, HeroPill } from "@/components/hero-header"
import { Chip } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { Text } from "@/components/ui/text"
import { getCourse, getCourseVersion, getIndex, getPrereqGraph } from "@/data/catalog"
import { missingGroups } from "@/data/prereq/evaluate"
import { prereqTreeFor, prerequisiteChain, unlockedBy } from "@/data/prereq/traverse"
import { useCompleted, useStarred } from "@/hooks/use-preferences"
import { count } from "@/lib/format"
import { openCourse } from "@/lib/navigation"
import { colors, radius, spacing } from "@/theme"

export default function CourseScreen() {
  const params = useLocalSearchParams<{ code: string; term?: string }>()
  const code = params.code
  const requestedTerm = params.term === undefined ? undefined : Number(params.term)
  const { terms } = getIndex()
  const graph = getPrereqGraph()
  const course = getCourse(code)
  const { starred, toggle: toggleStarred, add: addStarred } = useStarred()
  const { completed, toggle: toggleCompleted, add: addCompleted } = useCompleted()
  const isStarred = starred.has(code)
  const isCompleted = completed.has(code)

  // The term the user was browsing if the course runs then, otherwise its newest term.
  const [term, setTerm] = useState(
    requestedTerm !== undefined && course?.terms.includes(requestedTerm)
      ? requestedTerm
      : course?.terms[0],
  )
  const version = useMemo(() => course && getCourseVersion(code, term), [course, code, term])
  const tree = useMemo(() => prereqTreeFor(graph, code, term), [graph, code, term])
  const chainLevels = useMemo(() => {
    const levels: string[][] = []
    for (const { code: c, depth } of prerequisiteChain(graph, code, term)) {
      ;(levels[depth - 1] ??= []).push(c)
    }
    return levels
  }, [graph, code, term])
  const unlocks = unlockedBy(graph, code)
  const open = (next: string) => openCourse(next, term)

  // Starring or completing a course whose prerequisites aren't met asks about those too.
  // Undoing either, or a course whose remaining requirements can't be checked, doesn't.
  const [prompt, setPrompt] = useState<"star" | "complete">()
  const missing = useMemo(
    () => (tree && !isCompleted ? missingGroups(tree, completed) : []),
    [tree, completed, isCompleted],
  )
  const onStarPress = () => {
    if (!isStarred && missing.length > 0) setPrompt("star")
    else toggleStarred(code)
  }
  const onCompletePress = () => {
    if (!isCompleted && missing.length > 0) setPrompt("complete")
    else toggleCompleted(code)
  }

  // The code fades into the fixed bar once the big one on the band has scrolled under it.
  const { top } = useSafeAreaInsets()
  const scrollY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y
  })
  const barTitleAnimated = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [30, 70], [0, 1], "clamp"),
  }))

  const bar = (
    <View style={[styles.bar, { paddingTop: top }]}>
      <HeroButton icon="chevron-back" accessibilityLabel="Back" onPress={() => router.back()} />
      <Animated.View style={[styles.barTitle, course && barTitleAnimated]}>
        <Text weight="semiBold" style={styles.onHero} numberOfLines={1}>
          {code}
        </Text>
      </Animated.View>
      {course ? (
        <HeroButton
          icon={isStarred ? "star" : "star-outline"}
          iconColor={isStarred ? colors.heroAccent : undefined}
          accessibilityLabel={isStarred ? "Unstar course" : "Star course"}
          accessibilityState={{ selected: isStarred }}
          testID="toggle-star"
          onPress={onStarPress}
        />
      ) : (
        <View style={styles.barSpacer} />
      )}
    </View>
  )

  if (!course || !version || term === undefined) {
    return (
      <View style={styles.flex}>
        {bar}
        <EmptyState heading={code} content="This course isn't in the catalogue." />
      </View>
    )
  }

  const notOffered =
    requestedTerm !== undefined && requestedTerm !== term && !course.terms.includes(requestedTerm)
  const moreDetails = [
    ["Co-requisite", version.corequisite],
    ["Exclusion", version.exclusion],
    ["Co-listed with", version.colist],
    ["Previously", version.previous],
  ] as const

  return (
    // The bar stays put and only the content scrolls, so Back is always in reach.
    <View style={styles.flex}>
      {bar}
      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={16}
        testID="course-scroll"
      >
        <HeroHeader
          safeTop={false}
          overscroll
          node={false}
          eyebrow={course.prefix}
          title={code}
          style={styles.band}
        >
          <Text size="md" weight="medium" style={[styles.onHero, styles.courseTitle]}>
            {version.title}
          </Text>
          <View style={styles.wrap}>
            <HeroPill icon="ribbon-outline" text={`${version.credits} credits`} />
            <HeroPill
              icon="school-outline"
              text={course.career === "UG" ? "Undergraduate" : "Postgraduate"}
            />
            <HeroPill icon="calendar-outline" text={terms[term].name} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isCompleted ? "Completed" : "Mark as completed"}
            accessibilityState={{ checked: isCompleted }}
            onPress={onCompletePress}
            testID="toggle-completed"
            style={({ pressed }) => [
              styles.completeButton,
              isCompleted && styles.completeButtonDone,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={isCompleted ? "checkmark-circle" : "add-circle-outline"}
              size={20}
              color={isCompleted ? colors.heroSuccess : colors.hero}
            />
            <Text size="xs" weight="semiBold" style={isCompleted ? styles.onHero : styles.hero}>
              {isCompleted ? "Completed" : "Mark as completed"}
            </Text>
          </Pressable>
        </HeroHeader>

        <Section icon="calendar-outline" title="Offered in">
          <View style={styles.wrap}>
            {terms.map((t, i) => {
              const offered = course.terms.includes(i)
              return (
                <Chip
                  key={t.code}
                  label={t.name}
                  selected={term === i}
                  muted={!offered}
                  disabled={!offered}
                  onPress={() => setTerm(i)}
                />
              )
            })}
          </View>
          {notOffered && (
            <Text size="xxs" style={styles.dim}>
              Not offered in {terms[requestedTerm].name}. Showing {terms[term].name}.
            </Text>
          )}
        </Section>

        <Section icon="git-network-outline" title="Prerequisites">
          {tree ? (
            <>
              {!isCompleted && <Eligibility tree={tree} completed={completed} />}
              <PrereqTree node={tree} rootCode={code} completed={completed} onOpenCourse={open} />
              <View style={styles.raw}>
                <Text size="xxs" weight="bold" style={styles.dim}>
                  As written
                </Text>
                <LinkedCodesText text={version.prerequisite} onPressCode={open} />
              </View>
            </>
          ) : (
            <Text size="xs" style={styles.dim}>
              No prerequisites listed.
            </Text>
          )}
        </Section>

        {chainLevels.length > 0 && (
          <Section
            icon="layers-outline"
            title="Full prerequisite chain"
            subtitle={`${count(chainLevels.flat().length, "course")} across ${count(chainLevels.length, "level")}`}
          >
            {chainLevels.map((level, i) => (
              <View key={i} style={styles.level}>
                <Text size="xxs" weight="bold" style={[styles.dim, styles.levelLabel]}>
                  Level {i + 1}
                </Text>
                <View style={[styles.wrap, styles.flex]}>
                  {level.map((c) => (
                    <CodeChip key={c} code={c} done={completed.has(c)} onPress={open} />
                  ))}
                </View>
              </View>
            ))}
          </Section>
        )}

        <Section
          icon="arrow-redo-outline"
          title="Leads to"
          subtitle={unlocks.length ? `Courses that list ${code} in their prerequisites` : undefined}
        >
          {unlocks.length ? (
            <View style={styles.wrap}>
              {unlocks.map((c) => (
                <CodeChip key={c} code={c} done={completed.has(c)} onPress={open} />
              ))}
            </View>
          ) : (
            <Text size="xs" style={styles.dim}>
              No course lists {code} as a prerequisite.
            </Text>
          )}
        </Section>

        {!!version.description && (
          <Section icon="document-text-outline" title="Description">
            <Text size="xs">{version.description}</Text>
          </Section>
        )}

        {moreDetails.map(
          ([label, value]) =>
            !!value && (
              <Section key={label} icon="information-circle-outline" title={label}>
                <LinkedCodesText text={value} onPressCode={open} />
              </Section>
            ),
        )}

        {version.attributes.length > 0 && (
          <Section icon="pricetag-outline" title="Attributes">
            {version.attributes.map((a) => (
              <Text key={a.label} size="xs">
                • {a.description}
              </Text>
            ))}
          </Section>
        )}

        {version.cilos.length > 0 && (
          <Section icon="bulb-outline" title="Learning outcomes">
            {version.cilos.map((c, i) => (
              <Text key={i} size="xs">
                {i + 1}. {c}
              </Text>
            ))}
          </Section>
        )}
      </Animated.ScrollView>

      <PrerequisitePrompt
        action="star"
        visible={prompt === "star"}
        code={code}
        groups={missing}
        already={starred}
        onConfirm={addStarred}
        onClose={() => setPrompt(undefined)}
      />
      <PrerequisitePrompt
        action="complete"
        visible={prompt === "complete"}
        code={code}
        groups={missing}
        already={completed}
        onConfirm={addCompleted}
        onClose={() => setPrompt(undefined)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dim: { color: colors.textDim },
  onHero: { color: colors.onHero },
  hero: { color: colors.hero },
  pressed: { opacity: 0.7 },
  content: { paddingBottom: spacing.xxl },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: colors.hero,
    zIndex: 1,
  },
  barTitle: { flex: 1, alignItems: "center" },
  barSpacer: { width: 44 },
  band: { paddingTop: spacing.xxs, paddingBottom: spacing.lg, gap: spacing.sm },
  courseTitle: { marginTop: -4 },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 46,
    marginTop: spacing.xxs,
    borderRadius: radius.md,
    backgroundColor: colors.onHero,
  },
  completeButtonDone: { backgroundColor: colors.heroRaised },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  raw: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    gap: 2,
  },
  level: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  levelLabel: { width: 52, paddingTop: 6 },
})
