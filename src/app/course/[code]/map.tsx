import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  type LayoutChangeEvent,
  PixelRatio,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native"
import { GestureDetector } from "react-native-gesture-handler"
import { useMMKVBoolean } from "react-native-mmkv"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from "react-native-svg"

import { PrerequisitePrompt } from "@/components/course/prerequisite-prompt"
import { HeroButton } from "@/components/hero-header"
import { type Box, edgeGeometry } from "@/components/map/edge-geometry"
import { MapCard, type MapCardProps } from "@/components/map/map-card"
import { MapControls } from "@/components/map/map-controls"
import { MapKey } from "@/components/map/map-key"
import { CourseNode, Junction } from "@/components/map/map-nodes"
import { MAX_ZOOM, useMapViewport } from "@/components/map/use-map-viewport"
import { Text } from "@/components/ui/text"
import { getPrereqGraph } from "@/data/catalog"
import {
  courseStatus,
  type CourseStatus,
  missingGroups,
  missingRequirements,
} from "@/data/prereq/evaluate"
import { buildCourseMap, lineage, MAP_SIZES, type MapNode, relationTo } from "@/data/prereq/map"
import { planPath } from "@/data/prereq/plan"
import { prereqTreeFor, unlockedBy } from "@/data/prereq/traverse"
import { useCompleted, useStarred } from "@/hooks/use-preferences"
import { openCourse, openMap } from "@/lib/navigation"
import { colors, spacing } from "@/theme"

/**
 * Content is drawn this much larger than the map's own units, and zoom never goes above 1:
 * scaling a view *up* on iOS scales a bitmap and blurs text; scaling *down* stays sharp.
 */
const K = 1.5
/** Room around the nodes, in content points (also leaves space for column labels). */
const PAD = 90
/**
 * Android's react-native-svg draws an SVG view into one bitmap, and Android refuses to draw a
 * bitmap over ~100 MB: a big map (all its edges are one SVG) at a phone's density would crash.
 * There the SVG is drawn smaller and scaled up to stay under this many pixels (~40 MB).
 */
const ANDROID_SVG_MAX_PIXELS = 10_000_000
/** Below this, a fitted map is too small to read: open centred on the course instead. */
const READABLE_ZOOM = 0.42
/** Height kept clear at the bottom while the selection card is showing. */
const CARD_SPACE = 220
/** Space kept clear of the floating controls at the top and the key at the bottom. */
const INSET = { top: 56, bottom: 84 }

export default function CourseMapScreen() {
  const params = useLocalSearchParams<{ code: string; term?: string }>()
  const code = params.code
  const term = params.term === undefined ? undefined : Number(params.term)
  const { top, bottom } = useSafeAreaInsets()
  const { starred } = useStarred()
  const { completed, toggle: toggleCompleted, add: addCompleted } = useCompleted()
  const graph = getPrereqGraph()

  const [showPath, setShowPath] = useState(true)
  const [selected, setSelected] = useState<string>()
  // The key (what the colours and lines mean) stays out of the way until asked for.
  const [keyOpen, setKeyOpen] = useState(false)
  // The first map a user opens shows how it works, once, for a few seconds.
  const [tipSeen, setTipSeen] = useMMKVBoolean("map.tipSeen")
  const [tip, setTip] = useState(() => !tipSeen)
  useEffect(() => {
    if (!tip) return
    setTipSeen(true)
    const t = setTimeout(() => setTip(false), 5000)
    return () => clearTimeout(t)
  }, [tip, setTipSeen])
  // Courses expanded to the right of the focus, one per column (see buildCourseMap).
  const [trail, setTrail] = useState<string[]>([])

  // Always both directions: what comes before, the course, and where it leads.
  const map = useMemo(
    () => buildCourseMap(graph, code, { term, trail }),
    [graph, code, term, trail],
  )
  // The focus and the expanded trail, in order: the explored route through "leads to".
  const explored = useMemo(() => [code, ...map.trail], [code, map.trail])
  const leadsOf = useCallback((id: string) => unlockedBy(graph, id).length, [graph])

  // Whether each course can be taken, from what's completed. Only shown once something is:
  // before that, every course would say "needs", which says nothing.
  const hasCompleted = completed.size > 0
  const treeOf = useCallback(
    (id: string) => prereqTreeFor(graph, id, id === code ? term : undefined),
    [graph, code, term],
  )
  const statusById = useMemo(() => {
    const out = new Map<string, CourseStatus>()
    for (const n of map.nodes)
      if (n.kind === "course") out.set(n.id, courseStatus(n.id, treeOf(n.id), completed))
    return out
  }, [map, treeOf, completed])
  // A junction is met when its group is: any option (one of) or every part (all of) done.
  const junctionMet = useCallback(
    (id: string) => {
      const into = map.edges.filter((e) => e.to === id && !e.loop).map((e) => e.from)
      const kind = map.nodes.find((n) => n.id === id)?.kind
      return kind === "any"
        ? into.some((c) => completed.has(c))
        : into.every((c) => completed.has(c))
    },
    [map, completed],
  )

  // Marking a course completed from the map asks about its unmet prerequisites, as the
  // course page does.
  const [completing, setCompleting] = useState<string>()
  const completingGroups = useMemo(() => {
    const tree = completing && treeOf(completing)
    return tree ? missingGroups(tree, completed) : []
  }, [completing, treeOf, completed])
  const onToggleCompleted = (id: string) => {
    if (completed.has(id)) return toggleCompleted(id)
    const tree = treeOf(id)
    if (tree && missingGroups(tree, completed).length > 0) setCompleting(id)
    else toggleCompleted(id)
  }

  const path = useMemo(
    () => planPath(graph, code, completed, starred, term),
    [graph, code, completed, starred, term],
  )
  // Step number of each course on "Your path" (the course itself is the goal).
  const pathStep = useMemo(() => {
    const steps = new Map<string, number>()
    path?.steps.forEach((s, i) => s.forEach((c) => steps.set(c.code, i + 1)))
    return steps
  }, [path])
  const lit = useMemo(() => (selected ? lineage(map, selected) : undefined), [map, selected])

  // Content geometry: map units -> content points.
  const origin = useMemo(
    () => ({ x: map.bounds.minX * K - PAD, y: map.bounds.minY * K - PAD }),
    [map.bounds],
  )
  const content = {
    w: (map.bounds.maxX - map.bounds.minX) * K + PAD * 2,
    h: (map.bounds.maxY - map.bounds.minY) * K + PAD * 2,
  }
  const rectOf = useCallback(
    (n: MapNode): Box => ({
      x: n.x * K - (n.width * K) / 2 - origin.x,
      y: n.y * K - (n.height * K) / 2 - origin.y,
      w: n.width * K,
      h: n.height * K,
    }),
    [origin],
  )
  const nodeById = useMemo(() => new Map(map.nodes.map((n) => [n.id, n])), [map])

  // The edges SVG's down-scaling on Android (see ANDROID_SVG_MAX_PIXELS); 1 = full resolution.
  const svgScale =
    Platform.OS === "android"
      ? Math.max(
          1,
          Math.sqrt((content.w * content.h * PixelRatio.get() ** 2) / ANDROID_SVG_MAX_PIXELS),
        )
      : 1

  // --- Viewport and gestures -------------------------------------------------------------------

  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const onViewportLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setViewport({ w: width, h: height })
  }
  const { scale, gesture, $contentAnimated, moveTo, fitTransform, fit, ...view } = useMapViewport({
    content,
    origin,
    viewport,
    inset: INSET,
    onTap: (x, y) => hitTest(x, y),
  })
  const { centreOnRect, frameRegion, zoomBy } = view
  const centreOn = useCallback(
    (id: string, s: number, below?: number) => {
      const n = nodeById.get(id)
      return n ? centreOnRect(rectOf(n), s, below) : { s, x: 0, y: 0 }
    },
    [nodeById, rectOf, centreOnRect],
  )

  // Frame the map when it opens (or the viewport changes): the whole map if it's readable that
  // way; otherwise the course's neighbourhood (direct prerequisites, the course, what it leads
  // to), or, if that's too wide to read, the prerequisites side and the course.
  const framed = useRef("")
  useEffect(() => {
    if (!viewport.w) return
    const key = `${code}|${viewport.w}x${viewport.h}`
    if (framed.current === key) return
    const first = framed.current === ""
    framed.current = key
    const f = fitTransform()
    if (f.s >= READABLE_ZOOM) return moveTo(f, !first)
    const regionOf = (lo: number, hi: number): Box => {
      const near = map.nodes.filter((n) => n.rank >= lo && n.rank <= hi).map(rectOf)
      const x0 = Math.min(...near.map((r) => r.x))
      const y0 = Math.min(...near.map((r) => r.y))
      return {
        x: x0 - 30,
        y: y0 - 30,
        w: Math.max(...near.map((r) => r.x + r.w)) - x0 + 60,
        h: Math.max(...near.map((r) => r.y + r.h)) - y0 + 60,
      }
    }
    const wide = regionOf(-1, 1)
    const region = (viewport.w - 24) / wide.w >= READABLE_ZOOM + 0.08 ? wide : regionOf(-1, 0)
    const t = frameRegion(region, READABLE_ZOOM + 0.08)
    // A neighbourhood too tall to fit (a course that leads to dozens) keeps the course itself
    // in the middle vertically.
    const tooTall = region.h * t.s > viewport.h - INSET.top - INSET.bottom
    moveTo({ ...t, y: tooTall ? centreOn(code, t.s).y : t.y }, !first)
  }, [viewport, code, fitTransform, frameRegion, centreOn, moveTo, map.nodes, rectOf])

  // Selecting a course glides it into view above the selection card, zooming in to a readable
  // size first if the map is zoomed right out. The glide runs after the next layout (a tap can
  // add a column), and when the course has just been expanded it sits left of centre, so its
  // new column is in view too.
  const selectedRef = useRef<string | undefined>(undefined)
  const [glide, setGlide] = useState<{ id: string; ahead: boolean }>()
  const select = (id: string | undefined, ahead = false) => {
    selectedRef.current = id
    setSelected(id)
    if (id) setGlide({ id, ahead })
  }
  useEffect(() => {
    if (!glide || !nodeById.has(glide.id)) return
    const t = centreOn(glide.id, Math.max(scale.value, READABLE_ZOOM + 0.08), CARD_SPACE)
    const shift = glide.ahead ? (MAP_SIZES.column * K * t.s) / 2 : 0
    moveTo({ ...t, x: t.x - shift })
    setGlide(undefined)
  }, [glide, nodeById, centreOn, moveTo, scale])

  // Tapping a course on the "leads to" side also expands it: the trail keeps the columns
  // before it and swaps in this course, so exploring is one branch at a time.
  const open = (id: string) => {
    const n = nodeById.get(id)
    if (!n || n.kind !== "course") return
    if (n.rank >= 1) {
      setTrail([...map.trail.slice(0, n.rank - 1), id])
      select(id, leadsOf(id) > 0)
    } else {
      select(id)
    }
  }

  // Where a course sits relative to the one the map is about, in words, for the card.
  const relationText = (id: string): string => {
    const r = relationTo(map, id)
    switch (r.kind) {
      case "focus":
        return "The course this map is about"
      case "direct":
        return `Direct prerequisite of ${code}`
      case "before":
        return `${r.steps} steps before ${code}`
      case "builds-on":
        return `Builds on ${r.parent}`
    }
  }

  // The card's verdict: the same answer as the course page's eligibility banner.
  const verdictOf = (id: string): MapCardProps["verdict"] => {
    const tree = treeOf(id)
    const status = statusById.get(id) ?? courseStatus(id, tree, completed)
    if (status.kind === "completed") return { tone: "done", text: "Completed" }
    if (!tree) return { tone: "ok", text: "No prerequisites: you can take this" }
    if (!hasCompleted) {
      return { tone: "muted", text: "Mark courses you've completed to see what you can take" }
    }
    if (status.kind === "can-take") return { tone: "ok", text: "You can take this" }
    if (status.kind === "unknown") {
      return { tone: "muted", text: "Can't check: it needs something that isn't a course" }
    }
    return {
      tone: "warn",
      text: `Still needed: ${missingRequirements(tree, completed).join(", ")}`,
    }
  }

  // Back along the explored route: keep it up to that course and glide there.
  const goToRoute = (index: number) => {
    setTrail(map.trail.slice(0, index))
    select(explored[index], index > 0 || leadsOf(code) > 0)
  }

  // A tap, in content points: select the course under the finger, or clear.
  const hitTest = (px: number, py: number) => {
    const slop = 8
    const hit = map.nodes.find((n) => {
      const r = rectOf(n)
      return (
        px >= r.x - slop && px <= r.x + r.w + slop && py >= r.y - slop && py <= r.y + r.h + slop
      )
    })
    if (hit?.kind === "course") {
      if (hit.id === selectedRef.current) select(undefined)
      else open(hit.id)
    } else if (!hit) select(undefined)
  }

  // Zoom in: toward the selected course if there is one, else around the middle.
  const zoomIn = () => {
    if (!selected) return zoomBy(1.6)
    moveTo(centreOn(selected, Math.min(MAX_ZOOM, scale.value * 1.6), CARD_SPACE))
  }

  // --- Drawing -----------------------------------------------------------------------------------

  const selectedNode = selected ? nodeById.get(selected) : undefined
  const onPath = (id: string) => showPath && (id === code || pathStep.has(id))
  const edgeOnPath = (from: string, to: string) => {
    if (!showPath || !path) return false
    // Through a junction: highlighted if the course on each side is on the path.
    const f = nodeById.get(from)
    const t = nodeById.get(to)
    const fromOk =
      f?.kind === "course" ? onPath(from) : map.edges.some((e) => e.to === from && onPath(e.from))
    const toOk =
      t?.kind === "course" ? onPath(to) : map.edges.some((e) => e.from === to && onPath(e.to))
    return fromOk && toOk
  }

  const paths = map.edges.flatMap((e) => {
    const from = nodeById.get(e.from)
    const to = nodeById.get(e.to)
    if (!from || !to) return []
    const inLineage = !!lit && lit.has(e.from) && lit.has(e.to) && !e.loop
    const at = explored.indexOf(e.to)
    const onRoute = !e.loop && at > 0 && explored[at - 1] === e.from
    const highlighted = !e.loop && (onRoute || edgeOnPath(e.from, e.to))
    const width = inLineage ? 4 : highlighted ? 4.5 : 2.2
    // Arrowheads point into the course each edge feeds, so direction doesn't rely on layout.
    const { line, arrow } = edgeGeometry(rectOf(from), rectOf(to), e.loop, width)
    // A requirement already met: out of a completed course, or out of a satisfied group.
    const done =
      !e.loop && (completed.has(e.from) || (from.kind !== "course" && junctionMet(e.from)))
    const stroke = e.loop
      ? colors.warning
      : inLineage || highlighted
        ? colors.tint
        : done
          ? colors.success
          : colors.border
    const opacity = lit && !inLineage ? 0.12 : e.loop ? 0.9 : inLineage || highlighted ? 1 : 0.85
    // Highlighted edges are drawn last, on top.
    return [
      {
        key: `${e.from}>${e.to}`,
        line,
        arrow,
        loop: e.loop,
        stroke,
        width,
        opacity,
        z: +(inLineage || highlighted),
      },
    ]
  })
  paths.sort((a, b) => a.z - b.z)

  const columnLabel = (rank: number) =>
    rank === 0
      ? "THIS COURSE"
      : rank > 0
        ? "LEADS TO"
        : rank === -1
          ? "DIRECT PREREQUISITES"
          : `${-rank} STEPS BACK`

  const isEmpty = map.nodes.length === 1

  return (
    <View style={styles.flex}>
      <View style={[styles.bar, { paddingTop: top }]}>
        <HeroButton icon="chevron-back" accessibilityLabel="Back" onPress={() => router.back()} />
        <View style={styles.barTitle}>
          <Text size="xxs" weight="semiBold" style={styles.barEyebrow}>
            Course map
          </Text>
          <Text weight="semiBold" style={styles.onHero}>
            {code}
          </Text>
        </View>
        <HeroButton
          icon="scan-outline"
          accessibilityLabel="Fit the whole map"
          testID="map-fit"
          onPress={fit}
        />
      </View>

      <View style={[styles.flex, styles.canvas]} onLayout={onViewportLayout}>
        {/* A dot grid across the canvas; it frames the map, so it doesn't pan with it. */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Pattern id="dots" width={22} height={22} patternUnits="userSpaceOnUse">
              <Circle cx={2} cy={2} r={1.2} fill={colors.separator} />
            </Pattern>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#dots)" />
        </Svg>

        <GestureDetector gesture={gesture}>
          <View style={styles.flex} collapsable={false}>
            <Animated.View
              style={[
                { width: content.w, height: content.h },
                styles.contentOrigin,
                $contentAnimated,
              ]}
            >
              <Svg
                width={content.w / svgScale}
                height={content.h / svgScale}
                viewBox={`0 0 ${content.w} ${content.h}`}
                style={[styles.topLeft, { transform: [{ scale: svgScale }] }]}
              >
                {paths.map((p) => (
                  <G key={p.key} opacity={p.opacity}>
                    <Path
                      d={p.line}
                      stroke={p.stroke}
                      strokeWidth={p.width}
                      strokeDasharray={p.loop ? "10 8" : undefined}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <Path d={p.arrow} fill={p.stroke} />
                  </G>
                ))}
              </Svg>

              {!isEmpty &&
                map.columns.map((col) => (
                  <Text
                    key={col.rank}
                    weight="semiBold"
                    style={[
                      styles.columnLabel,
                      { left: col.x * K - origin.x - 140, top: PAD - 64 },
                    ]}
                  >
                    {columnLabel(col.rank)}
                  </Text>
                ))}

              {map.nodes
                .filter((n) => n.kind !== "course")
                .map((n) => (
                  <Junction
                    key={n.id}
                    node={n}
                    rect={rectOf(n)}
                    dim={!!lit && !lit.has(n.id)}
                    options={map.edges.filter((e) => e.to === n.id).length}
                    met={junctionMet(n.id)}
                  />
                ))}

              {map.nodes
                .filter((n) => n.kind === "course")
                .map((n) => (
                  <CourseNode
                    key={n.id}
                    node={n}
                    rect={rectOf(n)}
                    isFocus={n.id === code}
                    isSelected={n.id === selected}
                    completed={completed.has(n.id)}
                    starred={starred.has(n.id)}
                    step={showPath ? pathStep.get(n.id) : undefined}
                    onPathRing={(showPath && pathStep.has(n.id)) || map.trail.includes(n.id)}
                    leads={n.rank >= 1 && !map.trail.includes(n.id) ? leadsOf(n.id) : 0}
                    status={hasCompleted ? statusById.get(n.id) : undefined}
                    dim={!!lit && !lit.has(n.id)}
                    onSelect={open}
                  />
                ))}
            </Animated.View>
          </View>
        </GestureDetector>

        <MapControls
          hasPath={!!path}
          showPath={showPath}
          onTogglePath={() => setShowPath((v) => !v)}
          route={map.trail.length > 0 ? explored : []}
          onRoute={goToRoute}
        />

        <View style={styles.zoomButtons} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zoom in"
            onPress={zoomIn}
            style={styles.roundButton}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fit the whole map"
            onPress={fit}
            style={styles.roundButton}
          >
            <Ionicons name="contract-outline" size={18} color={colors.text} />
          </Pressable>
        </View>

        {isEmpty && (
          <View style={styles.emptyNote} pointerEvents="none">
            <Text size="xs" style={styles.dim}>
              {code} has no prerequisites and isn&apos;t a prerequisite for anything.
            </Text>
          </View>
        )}

        {/* Bottom: the selected course's card, or the key. */}
        <View style={[styles.bottom, { paddingBottom: bottom + 12 }]} pointerEvents="box-none">
          {selectedNode ? (
            <MapCard
              code={selectedNode.id}
              node={selectedNode}
              relation={relationText(selectedNode.id)}
              isFocus={selectedNode.id === code}
              completed={completed.has(selectedNode.id)}
              starred={starred.has(selectedNode.id)}
              step={pathStep.get(selectedNode.id)}
              loop={map.edges.some(
                (e) => e.loop && (e.from === selectedNode.id || e.to === selectedNode.id),
              )}
              leads={selectedNode.rank >= 0 ? leadsOf(selectedNode.id) : undefined}
              term={term}
              verdict={verdictOf(selectedNode.id)}
              onToggleCompleted={() => onToggleCompleted(selectedNode.id)}
              onOpen={() => openCourse(selectedNode.id, term)}
              onCentre={() => openMap(selectedNode.id, term)}
              onClose={() => select(undefined)}
            />
          ) : (
            <View style={styles.keyArea} pointerEvents="box-none">
              {tip && !keyOpen && (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(300)}
                  style={styles.tip}
                  pointerEvents="none"
                >
                  <Ionicons name="hand-left-outline" size={15} color={colors.white} />
                  <Text size="xxs" weight="medium" style={styles.onHero}>
                    Tap a course to explore where it leads · pinch to zoom
                  </Text>
                </Animated.View>
              )}
              {keyOpen && <MapKey showPath={showPath && !!path} />}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={keyOpen ? "Hide the map key" : "Show the map key"}
                accessibilityState={{ expanded: keyOpen }}
                testID="map-key-toggle"
                onPress={() => setKeyOpen((v) => !v)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.roundButton,
                  keyOpen && styles.roundButtonOn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={keyOpen ? "close" : "information"}
                  size={keyOpen ? 20 : 22}
                  color={keyOpen ? colors.white : colors.tint}
                />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <PrerequisitePrompt
        action="complete"
        visible={!!completing}
        code={completing ?? ""}
        groups={completingGroups}
        already={completed}
        onConfirm={addCompleted}
        onClose={() => setCompleting(undefined)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.75 },
  dim: { color: colors.textDim },
  onHero: { color: colors.onHero },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: colors.hero,
    zIndex: 2,
  },
  barTitle: { flex: 1, alignItems: "center" },
  barEyebrow: { color: colors.heroAccent, textTransform: "uppercase", letterSpacing: 1.2 },
  canvas: { backgroundColor: colors.background, overflow: "hidden" },
  topLeft: { transformOrigin: "0 0" },
  contentOrigin: { position: "absolute", left: 0, top: 0, transformOrigin: "0 0" },
  columnLabel: {
    position: "absolute",
    width: 280,
    textAlign: "center",
    color: colors.textDim,
    letterSpacing: 1.2,
    fontSize: 17,
    lineHeight: 24,
  },
  keyArea: { gap: 10, alignItems: "flex-start" },
  tip: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: colors.hero,
  },
  zoomButtons: { position: "absolute", right: 14, top: 12, gap: 10 },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  roundButtonOn: { backgroundColor: colors.tint },
  bottom: { position: "absolute", left: 12, right: 12, bottom: 0 },
  emptyNote: {
    position: "absolute",
    top: "58%",
    left: spacing.xl,
    right: spacing.xl,
    alignItems: "center",
  },
})
