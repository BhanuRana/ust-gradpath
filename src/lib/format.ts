/** "1 course", "4,030 courses". Pass `plural` for irregular words. */
export function count(n: number, singular: string, plural = `${singular}s`): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? singular : plural}`
}
