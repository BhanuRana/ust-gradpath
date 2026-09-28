import { useCallback, useMemo } from "react"
import { useMMKVObject, useMMKVString } from "react-native-mmkv"

import { getIndex } from "@/data/catalog"

/**
 * The user's saved state, persisted with MMKV (synchronous, on-device). The hooks subscribe to
 * their key, so every screen using one stays in sync with no context or state library.
 */

/** A persisted set of course codes: stored as a sorted array, exposed as a Set. */
function useCodeSet(key: string) {
  const [list, setList] = useMMKVObject<string[]>(key)
  const codes = useMemo(() => new Set(list), [list])

  const toggle = useCallback(
    (code: string) =>
      setList((prev = []) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code].sort(),
      ),
    [setList],
  )
  const add = useCallback(
    (more: string[]) => setList((prev = []) => [...new Set([...prev, ...more])].sort()),
    [setList],
  )
  return { codes, toggle, add }
}

/** Courses the user wants quick access to. */
export function useStarred() {
  const { codes, toggle, add } = useCodeSet("prefs.starred")
  return { starred: codes, toggle, add }
}

/** Courses the user has passed. */
export function useCompleted() {
  const { codes, toggle, add } = useCodeSet("prefs.completed")
  return { completed: codes, toggle, add }
}

/**
 * The term being browsed. Stored by term code ("2610") rather than index, so it stays valid if
 * the dataset gains terms; "all" means all terms. Defaults to the newest term.
 */
export function useSelectedTerm() {
  const [stored, setStored] = useMMKVString("prefs.term")
  const { terms } = getIndex()
  const term =
    stored === "all"
      ? undefined
      : Math.max(
          0,
          terms.findIndex((t) => t.code === stored),
        )
  const setTerm = useCallback(
    (next: number | undefined) => setStored(next === undefined ? "all" : terms[next].code),
    [setStored, terms],
  )
  return [term, setTerm] as const
}
