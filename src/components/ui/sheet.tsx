import { type ReactNode, useCallback, useEffect, useState } from "react"
import {
  type LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
} from "react-native"
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler"
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

import { colors, radius } from "@/theme"

const OPEN = { duration: 300, easing: Easing.out(Easing.cubic) }
const CLOSE = { duration: 220, easing: Easing.in(Easing.cubic) }

interface SheetProps {
  visible: boolean
  /** The screen edge it slides from, and the way it's swiped away. */
  edge: "top" | "bottom"
  /** Called once it has finished closing, however it was closed. */
  onClose: () => void
  /** Gets `close`, which animates the sheet out; use it after a confirming action. */
  children: (close: () => void) => ReactNode
  style?: ViewStyle
  testID?: string
}

/**
 * A sheet over a dimmed backdrop. It slides in from its edge, and closes on the backdrop, the
 * back button, or a swipe towards its edge; pulling the other way stretches a little and
 * springs back.
 */
export function Sheet({ visible, edge, onClose, children, style, testID }: SheetProps) {
  const { height: screenHeight } = useWindowDimensions()
  // +1 when closing moves the sheet down (a bottom sheet), -1 when it moves up.
  const out = edge === "bottom" ? 1 : -1

  // Stays mounted after `visible` turns false until the closing animation ends.
  const [mounted, setMounted] = useState(visible)
  const [wasVisible, setWasVisible] = useState(visible)
  if (visible !== wasVisible) {
    setWasVisible(visible)
    if (visible) setMounted(true)
  }

  const progress = useSharedValue(0)
  const drag = useSharedValue(0)
  const height = useSharedValue(screenHeight)
  useEffect(() => {
    if (visible) drag.value = 0
  }, [visible, drag])

  const finishClose = useCallback(() => {
    setMounted(false)
    onClose()
  }, [onClose])

  const close = useCallback(() => {
    drag.value = withTiming(0, CLOSE)
    progress.value = withTiming(0, CLOSE, (done) => {
      if (done) scheduleOnRN(finishClose)
    })
  }, [drag, progress, finishClose])

  const onLayout = (e: LayoutChangeEvent) => {
    height.value = e.nativeEvent.layout.height
    if (progress.value === 0) progress.value = withTiming(1, OPEN)
  }

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onUpdate((e) => {
      const outward = e.translationY * out
      drag.value = (outward > 0 ? outward : outward * 0.15) * out
    })
    .onEnd((e) => {
      if (e.translationY * out > height.value * 0.25 || e.velocityY * out > 700) {
        scheduleOnRN(close)
      } else {
        drag.value = withSpring(0, { damping: 18, stiffness: 220 })
      }
    })

  const sheetAnimated = useAnimatedStyle(() => ({
    transform: [{ translateY: out * (1 - progress.value) * height.value + drag.value }],
  }))
  const backdropAnimated = useAnimatedStyle(() => ({
    opacity: progress.value * interpolate(drag.value * out, [0, height.value], [1, 0], "clamp"),
  }))

  if (!mounted) return null

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <GestureHandlerRootView style={styles.flex}>
        <Animated.View style={[styles.backdrop, backdropAnimated]}>
          <Pressable
            style={styles.flex}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          />
        </Animated.View>
        <GestureDetector gesture={pan}>
          <Animated.View
            onLayout={onLayout}
            style={[styles.sheet, styles[edge], style, sheetAnimated]}
            testID={testID}
          >
            {children(close)}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  top: {
    top: 0,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    shadowOffset: { width: 0, height: 8 },
  },
  bottom: {
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    shadowOffset: { width: 0, height: -8 },
  },
})
