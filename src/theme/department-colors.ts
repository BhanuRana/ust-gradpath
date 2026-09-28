/**
 * A stable accent colour per department, so a prefix looks the same in lists, search results
 * and course pages. The hues are categorical and avoid green and amber (met / still needed)
 * and plain blue (the tap colour).
 */
const HUES = [
  "#C2553A", // coral
  "#11776F", // teal
  "#7A4BB0", // purple
  "#B0426B", // rose
  "#4F55B8", // indigo
  "#6B7A1E", // olive
  "#8A5A2B", // brown
  "#4A6275", // slate
] as const

export interface DepartmentColor {
  /** Text and icons. */
  fg: string
  /** Badge background: the same hue at ~12% opacity. */
  bg: string
}

const cache = new Map<string, DepartmentColor>()

export function departmentColor(prefix: string): DepartmentColor {
  let color = cache.get(prefix)
  if (!color) {
    let hash = 1
    for (let i = 0; i < prefix.length; i++) hash = (hash * 31 + prefix.charCodeAt(i)) >>> 0
    const fg = HUES[hash % HUES.length]
    color = { fg, bg: `${fg}1F` }
    cache.set(prefix, color)
  }
  return color
}
