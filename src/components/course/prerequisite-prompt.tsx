import { Ionicons } from "@expo/vector-icons"
import { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Sheet } from "@/components/ui/sheet"
import { Text } from "@/components/ui/text"
import { getCourse } from "@/data/catalog"
import type { MissingGroup } from "@/data/prereq/evaluate"
import { colors, radius, spacing } from "@/theme"

import { DeptBadge } from "./dept-badge"

/** What the user was doing when the prompt appeared. */
export type PromptAction = "star" | "complete"

const COPY = {
  star: {
    id: "star",
    title: "Prerequisites not met yet",
    body: (code: string) =>
      `${code} needs these first. Star them too, so your plan is all in My Courses.`,
    confirm: (code: string, n: number) => `Star ${code} + ${n} prerequisite${n === 1 ? "" : "s"}`,
    only: (code: string) => `Star only ${code}`,
    pickSome: "Pick prerequisites to star",
    already: "Starred",
    icon: "star",
  },
  complete: {
    id: "complete",
    title: "Did you also complete these?",
    body: (code: string) =>
      `${code} needs them first, so you've probably done them too. Tick what you've completed.`,
    confirm: (code: string, n: number) => `Mark ${code} + ${n} completed`,
    only: (code: string) => `Only ${code}`,
    pickSome: "Pick the ones you've completed",
    already: "Completed",
    icon: "checkmark-circle",
  },
} as const

interface PrerequisitePromptProps {
  action: PromptAction
  visible: boolean
  /** The course being starred or completed. */
  code: string
  /** Its unmet prerequisites (see `missingGroups`). */
  groups: MissingGroup[]
  /** Courses already starred (or completed), shown as such and not offered again. */
  already: ReadonlySet<string>
  /** Called with every code to add: the course itself plus the chosen prerequisites. */
  onConfirm: (codes: string[]) => void
  onClose: () => void
}

/** A course can be picked if it's in the catalogue and not already added. */
const pickable = (codes: string[], already: ReadonlySet<string>) =>
  codes.every((c) => !!getCourse(c)) && codes.some((c) => !already.has(c))

/** Required courses are preselected; each "one of" group preselects its first option. */
function initialPicks(groups: MissingGroup[], already: ReadonlySet<string>) {
  const required = new Set(
    groups.flatMap((g) => (g.kind === "all" && pickable([g.code], already) ? [g.code] : [])),
  )
  const choices = groups.map((g) => {
    if (g.kind === "all") return undefined
    // A group already covered by one of its options needs nothing more.
    if (g.options.some((o) => o.every((c) => already.has(c)))) return undefined
    const first = g.options.findIndex((o) => pickable(o, already))
    return first === -1 ? undefined : first
  })
  return { required, choices }
}

/**
 * Shown when starring (or completing) a course whose prerequisites aren't met: it says what's
 * missing and offers to add those courses too. Required courses are checkboxes; "one of"
 * groups are pick-one (tap the picked option again to clear it). Dismissing adds nothing.
 */
export function PrerequisitePrompt(props: PrerequisitePromptProps) {
  const { action, visible, code, groups, already, onConfirm, onClose } = props
  const copy = COPY[action]
  const { bottom } = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()

  const [picks, setPicks] = useState(() => initialPicks(groups, already))
  // Fresh picks each time the prompt opens, and only then.
  const [wasVisible, setWasVisible] = useState(visible)
  if (visible !== wasVisible) {
    setWasVisible(visible)
    if (visible) setPicks(initialPicks(groups, already))
  }

  const extra = useMemo(() => {
    const codes = new Set(picks.required)
    groups.forEach((g, i) => {
      const choice = picks.choices[i]
      if (g.kind === "any" && choice !== undefined) g.options[choice].forEach((c) => codes.add(c))
    })
    return [...codes].filter((c) => !already.has(c))
  }, [picks, groups, already])

  const toggleRequired = (c: string) =>
    setPicks(({ required, choices }) => {
      const next = new Set(required)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return { required: next, choices }
    })
  const choose = (group: number, option: number) =>
    setPicks(({ required, choices }) => ({
      required,
      choices: choices.map((v, i) => (i === group ? (v === option ? undefined : option) : v)),
    }))

  const primaryLabel = extra.length ? copy.confirm(code, extra.length) : copy.pickSome

  return (
    <Sheet
      visible={visible}
      edge="bottom"
      onClose={onClose}
      style={{ ...styles.sheet, paddingBottom: bottom + spacing.sm }}
      testID={`${copy.id}-prompt`}
    >
      {(close) => {
        const confirm = (codes: string[]) => {
          onConfirm(codes)
          close()
        }
        return (
          <>
            <View style={styles.grabber} />
            <View style={styles.heading}>
              <View style={[styles.headingIcon, action === "complete" && styles.headingIconDone]}>
                <Ionicons
                  name={action === "star" ? "alert-circle" : "school"}
                  size={22}
                  color={action === "star" ? colors.warning : colors.success}
                />
              </View>
              <View style={styles.flex}>
                <Text size="lg" weight="medium">
                  {copy.title}
                </Text>
                <Text size="xs" style={styles.dim}>
                  {copy.body(code)}
                </Text>
              </View>
            </View>

            <ScrollView style={{ maxHeight: screenHeight * 0.45 }} bounces={false}>
              {groups.map((g, gi) =>
                g.kind === "all" ? (
                  <View key={g.code} style={styles.group}>
                    <GroupLabel text="Required" />
                    <OptionRow
                      codes={[g.code]}
                      control="checkbox"
                      selected={picks.required.has(g.code)}
                      already={already}
                      action={action}
                      onPress={() => toggleRequired(g.code)}
                    />
                  </View>
                ) : (
                  <View key={`any-${gi}`} style={styles.group} accessibilityRole="radiogroup">
                    <GroupLabel text="One of" />
                    {g.options.map((codes, oi) => (
                      <OptionRow
                        key={codes.join("+")}
                        codes={codes}
                        control="radio"
                        selected={picks.choices[gi] === oi}
                        already={already}
                        action={action}
                        onPress={() => choose(gi, oi)}
                      />
                    ))}
                  </View>
                ),
              )}
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={primaryLabel}
              accessibilityState={{ disabled: extra.length === 0 }}
              testID={`${copy.id}-with-prerequisites`}
              disabled={extra.length === 0}
              onPress={() => confirm([code, ...extra])}
              style={({ pressed }) => [
                styles.primary,
                extra.length === 0 && styles.primaryDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={copy.icon}
                size={18}
                color={extra.length ? colors.white : colors.textDim}
              />
              <Text weight="semiBold" style={extra.length ? styles.onTint : styles.dim}>
                {primaryLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              testID={`${copy.id}-only`}
              onPress={() => confirm([code])}
              hitSlop={6}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            >
              <Text weight="medium" style={styles.tint}>
                {copy.only(code)}
              </Text>
            </Pressable>
          </>
        )
      }}
    </Sheet>
  )
}

function GroupLabel({ text }: { text: string }) {
  return (
    <Text size="xxs" weight="semiBold" style={styles.groupLabel}>
      {text}
    </Text>
  )
}

interface OptionRowProps {
  codes: string[]
  control: "checkbox" | "radio"
  selected: boolean
  already: ReadonlySet<string>
  action: PromptAction
  onPress: () => void
}

/** One course, or courses taken together, that can be picked. */
function OptionRow({ codes, control, selected, already, action, onPress }: OptionRowProps) {
  const alreadyText = COPY[action].already
  const courses = codes.map(getCourse)
  const missing = courses.some((c) => !c)
  const allAlready = codes.every((c) => already.has(c))
  const disabled = missing || allAlready
  const label = codes.join(" + ")
  const detail = missing
    ? "Not in the catalogue"
    : codes.length > 1
      ? "Take together"
      : (courses[0]?.title ?? "")
  const icon =
    control === "radio"
      ? selected
        ? "radio-button-on"
        : "radio-button-off"
      : selected
        ? "checkbox"
        : "square-outline"

  return (
    <Pressable
      accessibilityRole={control}
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={`${label}, ${allAlready ? alreadyText : detail}`}
      disabled={disabled}
      onPress={onPress}
      testID={`prompt-option-${label}`}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        disabled && styles.rowDisabled,
        pressed && styles.pressed,
      ]}
    >
      <DeptBadge prefix={codes[0].split(" ")[0]} size={30} />
      <View style={styles.flex}>
        <Text size="xs" weight="semiBold" numberOfLines={1}>
          {label}
        </Text>
        <Text size="xxs" style={styles.dim} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      {allAlready ? (
        <View style={styles.alreadyTag}>
          <Ionicons
            name={COPY[action].icon}
            size={14}
            color={action === "star" ? colors.star : colors.success}
          />
          <Text size="xxs" style={styles.dim}>
            {alreadyText}
          </Text>
        </View>
      ) : (
        !missing && (
          <Ionicons name={icon} size={22} color={selected ? colors.tint : colors.textDim} />
        )
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  dim: { color: colors.textDim },
  tint: { color: colors.tint },
  onTint: { color: colors.white },
  sheet: { paddingHorizontal: spacing.md },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.separator,
  },
  heading: { flexDirection: "row", gap: spacing.sm, marginBottom: 4 },
  headingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warningSoft,
  },
  headingIconDone: { backgroundColor: colors.successSoft },
  group: { marginTop: spacing.sm, gap: 6 },
  groupLabel: { color: colors.textDim, textTransform: "uppercase", letterSpacing: 0.8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
  },
  rowSelected: { borderColor: colors.tint, backgroundColor: colors.tintSoft },
  rowDisabled: { opacity: 0.55 },
  alreadyTag: { flexDirection: "row", alignItems: "center", gap: 3 },
  primary: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.lg,
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint,
  },
  primaryDisabled: { backgroundColor: colors.surfaceAlt },
  secondary: { alignSelf: "center", paddingVertical: 14 },
})
