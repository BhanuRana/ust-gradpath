import { Fragment } from "react"
import { StyleSheet } from "react-native"

import { Text } from "@/components/ui/text"
import { getCourse } from "@/data/catalog"
import { colors } from "@/theme"

const CODE = /\b([A-Z]{4})\s?(\d{4}[A-Z]?)\b/g

interface LinkedCodesTextProps {
  text: string
  onPressCode: (code: string) => void
}

/**
 * Free text (exclusions, co-requisites, the prerequisite as written) with every course code
 * that exists in the catalogue turned into a link.
 */
export function LinkedCodesText({ text, onPressCode }: LinkedCodesTextProps) {
  const parts: (string | { code: string; raw: string })[] = []
  let last = 0
  for (const m of text.matchAll(CODE)) {
    const code = `${m[1]} ${m[2]}`
    if (!getCourse(code)) continue
    parts.push(text.slice(last, m.index), { code, raw: m[0] })
    last = m.index + m[0].length
  }
  parts.push(text.slice(last))

  return (
    <Text size="xs">
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <Fragment key={i}>{p}</Fragment>
        ) : (
          <Text
            key={i}
            size="xs"
            weight="semiBold"
            style={styles.link}
            accessibilityRole="link"
            onPress={() => onPressCode(p.code)}
          >
            {p.raw}
          </Text>
        ),
      )}
    </Text>
  )
}

const styles = StyleSheet.create({
  link: { color: colors.tint, textDecorationLine: "underline" },
})
