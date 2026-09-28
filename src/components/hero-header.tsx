import { Ionicons } from "@expo/vector-icons"
import type { ComponentProps, ReactNode } from "react"
import { Pressable, type PressableProps, StyleSheet, View, type ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/components/ui/text"
import { colors, radius, spacing } from "@/theme"

type IconName = ComponentProps<typeof Ionicons>["name"]

interface HeroHeaderProps {
  /** Small gold label above the title. */
  eyebrow?: string
  title?: string
  subtitle?: string
  /** Sits to the right of the title block, e.g. a round button. */
  right?: ReactNode
  /** Content under the title, still on the band: a search field, pills, stat tiles. */
  children?: ReactNode
  /** Pad for the status bar. Off when a bar above already does. */
  safeTop?: boolean
  /** Paint navy far above the band, so overscrolling a scroll view shows more band. */
  overscroll?: boolean
  /** Draw the gold node on the rings. Off where content runs under it. */
  node?: boolean
  style?: ViewStyle
}

/** The navy band at the top of each screen. Its faint rings and gold node echo the app icon. */
export function HeroHeader(props: HeroHeaderProps) {
  const { eyebrow, title, subtitle, right, children, safeTop = true, overscroll, style } = props
  const { node = true } = props
  const { top } = useSafeAreaInsets()

  return (
    <View style={[styles.band, safeTop && { paddingTop: top + 10 }, style]}>
      {overscroll && <View style={styles.overscroll} />}
      <View style={styles.decorClip} pointerEvents="none">
        <View style={[styles.ring, styles.ringOuter]} />
        <View style={[styles.ring, styles.ringInner]} />
        {node && <View style={styles.node} />}
      </View>
      {(title || right) && (
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            {eyebrow && (
              <Text size="xxs" weight="semiBold" style={styles.eyebrow}>
                {eyebrow}
              </Text>
            )}
            {title && (
              <Text size="xl" weight="bold" style={styles.title}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text size="xs" style={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  )
}

interface HeroButtonProps extends Omit<PressableProps, "children" | "style"> {
  icon: IconName
  /** Filled white with a navy icon, for a button whose state is "on". */
  active?: boolean
  iconColor?: string
  /** A small gold count in the corner. */
  badge?: number
}

/** A round translucent button for the band. */
export function HeroButton({ icon, active, iconColor, badge, ...rest }: HeroButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        active && styles.buttonActive,
        pressed && styles.pressed,
      ]}
      {...rest}
    >
      <Ionicons name={icon} size={21} color={iconColor ?? (active ? colors.hero : colors.onHero)} />
      {!!badge && (
        <View style={styles.badge}>
          <Text size="xxs" weight="bold" style={styles.badgeText}>
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

/** A translucent info pill for the band. */
export function HeroPill({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={13} color={colors.onHeroDim} />
      <Text size="xxs" weight="medium" style={styles.onHero}>
        {text}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  band: {
    backgroundColor: colors.hero,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  overscroll: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -1000,
    height: 1000,
    backgroundColor: colors.hero,
  },
  decorClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  ring: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: colors.heroLine,
    borderRadius: radius.pill,
  },
  ringOuter: { width: 260, height: 260, top: -110, right: -90 },
  ringInner: { width: 150, height: 150, top: -55, right: -35 },
  // On the outer ring, down and left of its centre.
  node: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 5,
    top: 110,
    right: 125,
    backgroundColor: colors.heroAccent,
    opacity: 0.9,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  eyebrow: { color: colors.heroAccent, textTransform: "uppercase", letterSpacing: 1.2 },
  title: { color: colors.onHero },
  subtitle: { color: colors.onHeroDim },
  onHero: { color: colors.onHero },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroRaised,
  },
  buttonActive: { backgroundColor: colors.onHero },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroAccent,
    borderWidth: 2,
    borderColor: colors.hero,
  },
  badgeText: { color: colors.hero, fontSize: 10, lineHeight: 12 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.heroRaised,
  },
})
