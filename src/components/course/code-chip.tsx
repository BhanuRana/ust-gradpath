import { Chip } from "@/components/ui/chip"
import { getCourse } from "@/data/catalog"

interface CodeChipProps {
  code: string
  /** The user completed it: shown green with a tick. */
  done?: boolean
  onPress: (code: string) => void
}

/** A course code that opens its page; dimmed when the course isn't in the catalogue. */
export function CodeChip({ code, done, onPress }: CodeChipProps) {
  const course = getCourse(code)
  return (
    <Chip
      label={code}
      selected={done}
      tone={done ? "success" : undefined}
      icon={done ? "checkmark" : undefined}
      muted={!course}
      disabled={!course}
      accessibilityLabel={[code, course?.title, done && "completed"].filter(Boolean).join(", ")}
      onPress={() => onPress(code)}
    />
  )
}
