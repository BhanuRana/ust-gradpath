import { router } from "expo-router"

/**
 * Pushes a course page. Always a push, so following a chain of prerequisites builds a back
 * stack. `term` is the term the user was browsing; the page shows it if the course runs then.
 */
export function openCourse(code: string, term?: number) {
  router.push({
    pathname: "/course/[code]",
    params: term === undefined ? { code } : { code, term: String(term) },
  })
}

/** Pushes the course map for `code`. */
export function openMap(code: string, term?: number) {
  router.push({
    pathname: "/course/[code]/map",
    params: term === undefined ? { code } : { code, term: String(term) },
  })
}
