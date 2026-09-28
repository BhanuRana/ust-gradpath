import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { FlatList, StyleSheet, View } from "react-native"

import { COURSE_ROW_HEIGHT, CourseRow } from "@/components/course/course-row"
import { HeroHeader } from "@/components/hero-header"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchField } from "@/components/ui/search-field"
import { getIndex, searchCourses } from "@/data/catalog"
import type { CourseSummary } from "@/data/types"
import { count } from "@/lib/format"
import { spacing } from "@/theme"

/** Room above the first card so its shadow isn't clipped; getItemLayout adds it to offsets. */
const LIST_TOP_GAP = 12

export default function ExploreScreen() {
  const { terms } = getIndex()
  const term = 0 // the newest term
  const [text, setText] = useState("")

  // The input updates `text` at once; the list filters on a deferred copy that React lets lag
  // behind during fast typing, so the keyboard never waits for the list.
  const query = useDeferredValue(text)
  const results = useMemo(() => searchCourses({ text: query, term }), [query])

  const listRef = useRef<FlatList<CourseSummary>>(null)
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [query])

  return (
    <View style={styles.screen}>
      <HeroHeader
        eyebrow={`HKUST · ${terms[term].name}`}
        title="Courses"
        subtitle={count(results.length, "course")}
      >
        <SearchField
          value={text}
          onChangeText={setText}
          placeholder="Search code or title, e.g. COMP 2011"
          testID="search-input"
        />
      </HeroHeader>

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
            content="Try a different search."
            action={{ label: "Clear search", onPress: () => setText("") }}
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingTop: LIST_TOP_GAP, paddingBottom: spacing.md },
})
