import type { ViewStyle } from "react-native"

import { colors } from "./colors"
import { radius } from "./spacing"

/** A raised card: white, with a soft shadow on the grey background. */
export const card: ViewStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  shadowColor: colors.shadow,
  shadowOpacity: 1,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
}
