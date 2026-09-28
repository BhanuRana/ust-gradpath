import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { FlatList, Keyboard, Pressable, ScrollView, StyleSheet, View } from "react-native"

import { COURSE_ROW_HEIGHT, CourseRow } from "@/components/course/course-row"
import { type CourseFilters, FilterSheet } from "@/components/course/filter-sheet"
import { HeroButton, HeroHeader } from "@/components/hero-header"
import { Chip } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchField } from "@/components/ui/search-field"
import { Text } from "@/components/ui/text"
import { getIndex, searchCourses } from "@/data/catalog"
import type { CourseSummary } from "@/data/types"
import { count } from "@/lib/format"
import { colors, spacing } from "@/theme"

/** Room above the first card so its shadow isn't clipped; getItemLayout adds it to offsets. */
const LIST_TOP_GAP = 12
/** The newest term. The term is never "unset": Reset comes back here. */
const DEFAULTS: CourseFilters = { term: 0 }

export default function ExploreScreen() {
  const { terms } = getIndex()
  const [text, setText] = useState("")
  const [filters, setFilters] = useState<CourseFilters>(DEFAULTS)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { term, prefix, career } = filters

  // The input updates `text` at once; the list filters on a deferred copy that React lets lag
  // behind during fast typing, so the keyboard never waits for the list.
  const query = useDeferredValue(text)
  const results = useMemo(() => searchCourses({ text: query, ...filters }), [query, filters])

  const listRef = useRef<FlatList<CourseSummary>>(null)
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [results])

  const countFor = useCallback(
    (f: CourseFilters) => searchCourses({ text: query, ...f }).length,
    [query],
  )
  const activeFilters = [prefix, career].filter(Boolean).length
  const update = (patch: Partial<CourseFilters>) => setFilters((f) => ({ ...f, ...patch }))
  const clearAll = () => {
    setText("")
    setFilters((f) => ({ term: f.term }))
  }

  return (
    <View style={styles.screen}>
      <HeroHeader
        eyebrow={`HKUST · ${term === undefined ? "All terms" : terms[term].name}`}
        title="Courses"
        subtitle={count(results.length, "course")}
        right={
          <HeroButton
            icon="options-outline"
            active={activeFilters > 0}
            badge={activeFilters}
            accessibilityLabel={activeFilters ? `Filters, ${activeFilters} active` : "Filters"}
            testID="filters-button"
            onPress={() => {
              Keyboard.dismiss()
              setSheetOpen(true)
            }}
          />
        }
      >
        <SearchField
          value={text}
          onChangeText={setText}
          placeholder="Search code or title, e.g. COMP 2011"
          testID="search-input"
        />
      </HeroHeader>

      {activeFilters > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipScroller}
          contentContainerStyle={styles.chipRow}
        >
          {prefix && (
            <Chip
              label={prefix}
              selected
              icon="close"
              accessibilityLabel={`Remove ${prefix} filter`}
              onPress={() => update({ prefix: undefined })}
            />
          )}
          {career && (
            <Chip
              label={career === "UG" ? "Undergraduate" : "Postgraduate"}
              selected
              icon="close"
              accessibilityLabel={`Remove ${career} filter`}
              onPress={() => update({ career: undefined })}
            />
          )}
          <Pressable accessibilityRole="button" onPress={clearAll} hitSlop={8}>
            <Text size="xs" weight="medium" style={styles.tint}>
              Clear filters
            </Text>
          </Pressable>
        </ScrollView>
      )}

      <FlatList
        ref={listRef}
        data={results}
        keyExtractor={(c) => c.code}
        renderItem={({ item }) => <CourseRow course={item} query={query} />}
        getItemLayout={(_, index) => ({
          length: COURSE_ROW_HEIGHT,
          offset: LIST_TOP_GAP + COURSE_ROW_HEIGHT * index,
          index,
        })}
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        windowSize={9}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            heading="No matching courses"
            content="Try a different search, or clear the filters."
            action={{ label: "Clear filters", onPress: clearAll }}
          />
        }
      />

      <FilterSheet
        visible={sheetOpen}
        value={filters}
        defaults={DEFAULTS}
        countFor={countFor}
        onApply={setFilters}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  tint: { color: colors.tint },
  chipScroller: { flexGrow: 0, flexShrink: 0 },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  list: { paddingTop: LIST_TOP_GAP, paddingBottom: spacing.md },
})
