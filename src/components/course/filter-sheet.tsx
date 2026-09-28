import { Ionicons } from "@expo/vector-icons"
import { type ReactNode, useMemo, useState } from "react"
import { Pressable, StyleSheet, Switch, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Chip } from "@/components/ui/chip"
import { Sheet } from "@/components/ui/sheet"
import { Text } from "@/components/ui/text"
import { getIndex } from "@/data/catalog"
import type { Career } from "@/data/types"
import { count } from "@/lib/format"
import { colors, radius, spacing } from "@/theme"

import { DepartmentPicker } from "./department-picker"
import { DeptBadge } from "./dept-badge"

export interface CourseFilters {
  /** Term index, or undefined for all terms. */
  term?: number
  prefix?: string
  career?: Career
  /** Only courses whose prerequisites the user meets. */
  onlyUnlocked?: boolean
}

interface FilterSheetProps {
  visible: boolean
  value: CourseFilters
  /** "Unlocked for me" is offered once the user has completed something. */
  canFilterUnlocked: boolean
  /** How many courses a set of filters would show, so the button can say before applying. */
  countFor: (filters: CourseFilters) => number
  /** What Reset goes back to. */
  defaults: CourseFilters
  onApply: (filters: CourseFilters) => void
  onClose: () => void
}

const LEVELS: { value: Career | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "UG", label: "Undergraduate" },
  { value: "PG", label: "Postgraduate" },
]

/**
 * Filters in a sheet that drops from the top, near the button that opened it. Changes are a
 * draft until "Show N courses"; dismissing (backdrop, swipe up, back) discards them.
 */
export function FilterSheet({
  visible,
  value,
  canFilterUnlocked,
  countFor,
  defaults,
  onApply,
  onClose,
}: FilterSheetProps) {
  const { top } = useSafeAreaInsets()
  const { terms, departments, courses } = getIndex()

  const [draft, setDraft] = useState(value)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Take a fresh draft each time the sheet opens, and only then: never while it's in use.
  const [wasVisible, setWasVisible] = useState(visible)
  if (visible !== wasVisible) {
    setWasVisible(visible)
    if (visible) setDraft(value)
  }

  const resultCount = useMemo(() => countFor(draft), [countFor, draft])

  // Department counts follow the draft's term and level, so the picker shows dead ends.
  const departmentCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of courses) {
      if (draft.term !== undefined && !c.terms.includes(draft.term)) continue
      if (draft.career && c.career !== draft.career) continue
      counts.set(c.prefix, (counts.get(c.prefix) ?? 0) + 1)
    }
    return counts
  }, [courses, draft.term, draft.career])

  const isDefault =
    draft.term === defaults.term &&
    draft.prefix === defaults.prefix &&
    draft.career === defaults.career &&
    !!draft.onlyUnlocked === !!defaults.onlyUnlocked
  const update = (patch: Partial<CourseFilters>) => setDraft((d) => ({ ...d, ...patch }))

  return (
    <Sheet
      visible={visible}
      edge="top"
      onClose={onClose}
      style={{ ...styles.sheet, paddingTop: top + spacing.xs }}
      testID="filter-sheet"
    >
      {(close) => (
        <>
          <View style={styles.titleRow}>
            <Text size="lg" weight="medium">
              Filters
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDraft(defaults)}
              disabled={isDefault}
              hitSlop={10}
            >
              <Text weight="medium" style={isDefault ? styles.dim : styles.tint}>
                Reset
              </Text>
            </Pressable>
          </View>

          <Section title="Term">
            <View style={styles.wrap}>
              <Chip
                label="All terms"
                selected={draft.term === undefined}
                onPress={() => update({ term: undefined })}
              />
              {terms.map((t, i) => (
                <Chip
                  key={t.code}
                  label={t.name}
                  selected={draft.term === i}
                  onPress={() => update({ term: i })}
                />
              ))}
            </View>
          </Section>

          <Section title="Level">
            <View style={styles.segmented} accessibilityRole="radiogroup">
              {LEVELS.map((level) => {
                const selected = draft.career === level.value
                return (
                  <Pressable
                    key={level.label}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={level.label}
                    onPress={() => update({ career: level.value })}
                    style={[styles.segment, selected && styles.segmentSelected]}
                  >
                    <Text
                      size="xs"
                      weight={selected ? "semiBold" : "medium"}
                      style={selected ? styles.tint : styles.dim}
                      numberOfLines={1}
                    >
                      {level.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </Section>

          <Section title="Department">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Department: ${draft.prefix ?? "All departments"}`}
              testID="filter-department"
              onPress={() => setPickerOpen(true)}
              style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
            >
              {draft.prefix ? (
                <DeptBadge prefix={draft.prefix} size={32} />
              ) : (
                <View style={styles.iconTile}>
                  <Ionicons name="apps-outline" size={16} color={colors.textDim} />
                </View>
              )}
              <Text weight="medium" style={styles.flex}>
                {draft.prefix ?? "All departments"}
              </Text>
              {draft.prefix && (
                <Text size="xs" style={styles.dim}>
                  {departmentCounts.get(draft.prefix) ?? 0}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
            </Pressable>
          </Section>

          {canFilterUnlocked && (
            <Section title="My progress">
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="Unlocked for me"
                accessibilityState={{ checked: !!draft.onlyUnlocked }}
                onPress={() => update({ onlyUnlocked: !draft.onlyUnlocked })}
                style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
              >
                <View style={styles.iconTile}>
                  <Ionicons name="lock-open-outline" size={16} color={colors.success} />
                </View>
                <View style={styles.flex}>
                  <Text weight="medium">Unlocked for me</Text>
                  <Text size="xxs" style={styles.dim}>
                    Only courses whose prerequisites you meet
                  </Text>
                </View>
                <Switch
                  value={!!draft.onlyUnlocked}
                  onValueChange={(on) => update({ onlyUnlocked: on })}
                  trackColor={{ true: colors.tint, false: colors.separator }}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
              </Pressable>
            </Section>
          )}

          <Pressable
            accessibilityRole="button"
            testID="filters-apply"
            onPress={() => {
              onApply(draft)
              close()
            }}
            style={({ pressed }) => [
              styles.apply,
              resultCount === 0 && styles.applyEmpty,
              pressed && styles.pressed,
            ]}
          >
            <Text weight="semiBold" style={resultCount === 0 ? styles.dim : styles.onTint}>
              {resultCount === 0 ? "No matching courses" : `Show ${count(resultCount, "course")}`}
            </Text>
          </Pressable>

          <View style={styles.grabber} />

          <DepartmentPicker
            visible={pickerOpen}
            departments={departments}
            counts={departmentCounts}
            selected={draft.prefix}
            onSelect={(prefix) => update({ prefix })}
            onClose={() => setPickerOpen(false)}
          />
        </>
      )}
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text size="xxs" weight="semiBold" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  dim: { color: colors.textDim },
  tint: { color: colors.tint },
  onTint: { color: colors.white },
  sheet: { paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  section: { marginTop: spacing.md, gap: spacing.xs },
  sectionTitle: { color: colors.textDim, textTransform: "uppercase", letterSpacing: 0.8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  segmented: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 9,
  },
  segmentSelected: {
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  apply: {
    marginTop: spacing.lg,
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint,
  },
  applyEmpty: { backgroundColor: colors.surfaceAlt },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: spacing.sm,
    backgroundColor: colors.separator,
  },
})
