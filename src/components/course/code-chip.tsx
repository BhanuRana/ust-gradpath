import { Chip } from "@/components/ui/chip"
import { getCourse } from "@/data/catalog"

interface CodeChipProps {
  code: string
  onPress: (code: string) => void
}

/** A course code that opens its page; dimmed when the course isn't in the catalogue. */
export function CodeChip({ code, onPress }: CodeChipProps) {
  const course = getCourse(code)
  return (
    <Chip
      label={code}
      muted={!course}
      disabled={!course}
      accessibilityLabel={[code, course?.title].filter(Boolean).join(", ")}
      onPress={() => onPress(code)}
    />
  )
}
