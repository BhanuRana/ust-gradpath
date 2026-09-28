import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"

import { Text } from "@/components/ui/text"
import { getCourse, getPrereqGraph } from "@/data/catalog"
import { evaluate } from "@/data/prereq/evaluate"
import { expansionState, prereqTreeFor } from "@/data/prereq/traverse"
import type { PrereqNode } from "@/data/types"
import { colors, spacing } from "@/theme"

interface PrereqTreeProps {
  /** Parsed prerequisites of the course being viewed. */
  node: PrereqNode
  /** The course being viewed: the first ancestor on every branch. */
  rootCode: string
  /** Courses the user has completed: ticked, and groups they satisfy are marked met. */
  completed: ReadonlySet<string>
  onOpenCourse: (code: string) => void
}

/**
 * The expandable prerequisite tree. The course's direct prerequisites are shown, and each can
 * be expanded to reveal its own, one level at a time, so rendering cost follows what the user
 * opens rather than the size of the graph (the deepest chain is 9 levels).
 */
export function PrereqTree({ node, rootCode, completed, onOpenCourse }: PrereqTreeProps) {
  return (
    <NodeView
      node={node}
      ancestors={[rootCode]}
      completed={completed}
      onOpenCourse={onOpenCourse}
    />
  )
}

interface NodeViewProps {
  node: PrereqNode
  /** Course codes from the root down to this node's parent course. */
  ancestors: string[]
  completed: ReadonlySet<string>
  onOpenCourse: (code: string) => void
}

function NodeView({ node, ancestors, completed, onOpenCourse }: NodeViewProps) {
  switch (node.kind) {
    case "course":
      return (
        <CourseNode
          code={node.code}
          note={node.note}
          ancestors={ancestors}
          completed={completed}
          onOpenCourse={onOpenCourse}
        />
      )
    case "text":
      return (
        <Text size="xs" style={styles.textNode}>
          {node.text}
        </Text>
      )
    default: {
      const label = node.kind === "all" ? "ALL OF" : "ONE OF"
      const met = completed.size > 0 && evaluate(node, completed) === "met"
      return (
        <View>
          <View style={[styles.groupPill, met && styles.groupPillMet]}>
            <Text size="xxs" weight="bold" style={[styles.groupLabel, met && styles.met]}>
              {met ? `${label} · MET ✓` : label}
            </Text>
          </View>
          <View style={styles.group}>
            {node.children.map((child, i) => (
              <NodeView
                key={i}
                node={child}
                ancestors={ancestors}
                completed={completed}
                onOpenCourse={onOpenCourse}
              />
            ))}
          </View>
        </View>
      )
    }
  }
}

interface CourseNodeProps {
  code: string
  note?: string
  ancestors: string[]
  completed: ReadonlySet<string>
  onOpenCourse: (code: string) => void
}

function CourseNode({ code, note, ancestors, completed, onOpenCourse }: CourseNodeProps) {
  const [expanded, setExpanded] = useState(false)

  const graph = getPrereqGraph()
  const course = getCourse(code)
  const state = course ? expansionState(graph, code, ancestors) : "missing"
  const canExpand = state === "expandable"
  // Deeper levels use each course's newest version; only the viewed course is term-specific.
  const children = expanded && canExpand ? prereqTreeFor(graph, code) : null
  const status = state === "expandable" ? undefined : STATUS_TEXT[state]
  const isCompleted = completed.has(code)

  return (
    <View>
      <View style={styles.courseRow}>
        {canExpand ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${expanded ? "Hide" : "Show"} prerequisites of ${code}`}
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((e) => !e)}
            hitSlop={10}
            style={styles.toggle}
          >
            <Ionicons
              name={expanded ? "chevron-down" : "chevron-forward"}
              size={16}
              color={colors.tint}
            />
          </Pressable>
        ) : (
          <View style={styles.toggle}>
            <Ionicons
              name={state === "cycle" ? "repeat" : "ellipse"}
              size={state === "cycle" ? 14 : 6}
              color={colors.textDim}
            />
          </View>
        )}

        <Pressable
          accessibilityRole={course ? "link" : "text"}
          accessibilityLabel={[code, course?.title, isCompleted && "completed", note, status]
            .filter(Boolean)
            .join(", ")}
          disabled={!course}
          onPress={() => onOpenCourse(code)}
          style={({ pressed }) => [styles.flex, pressed && styles.pressed]}
        >
          <Text size="xs">
            <Text size="xs" weight="bold" style={course ? styles.code : styles.dim}>
              {code}
            </Text>
            {course && (
              <Text size="xs" style={styles.dim}>
                {"  "}
                {course.title}
              </Text>
            )}
          </Text>
          {isCompleted && (
            <View style={styles.completedRow}>
              <Ionicons name="checkmark-circle" size={13} color={colors.success} />
              <Text size="xxs" style={styles.met}>
                Completed
              </Text>
            </View>
          )}
          {note && (
            <Text size="xxs" style={styles.note}>
              {note}
            </Text>
          )}
          {status && (
            <Text size="xxs" style={styles.status}>
              {status}
            </Text>
          )}
        </Pressable>
      </View>

      {children && (
        <View style={styles.nested}>
          <NodeView
            node={children}
            ancestors={[...ancestors, code]}
            completed={completed}
            onOpenCourse={onOpenCourse}
          />
        </View>
      )}
    </View>
  )
}

const STATUS_TEXT = {
  none: "No prerequisites",
  cycle: "↻ Loops back",
  missing: "Not in catalogue",
} as const

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  courseRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 4 },
  toggle: { width: 24, height: 22, alignItems: "center", justifyContent: "center" },
  code: { color: colors.tint },
  dim: { color: colors.textDim },
  note: { color: colors.textDim, fontStyle: "italic" },
  status: { color: colors.textDim, opacity: 0.8 },
  textNode: {
    color: colors.textDim,
    fontStyle: "italic",
    paddingVertical: 4,
    paddingLeft: spacing.xs,
  },
  groupPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: colors.surfaceAlt,
  },
  groupPillMet: { backgroundColor: colors.successSoft },
  groupLabel: { color: colors.textDim, letterSpacing: 0.8 },
  met: { color: colors.success },
  completedRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  group: {
    borderLeftWidth: 2,
    borderLeftColor: colors.separator,
    paddingLeft: spacing.xs,
    marginLeft: 4,
  },
  nested: {
    marginLeft: 11,
    paddingLeft: spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
})
