/**
 * Navy and gold, after HKUST's own colours. Navy marks anything you can tap; gold marks what
 * you've picked out (stars, search matches); green means met and amber means still needed.
 */
export const colors = {
  text: "#0F1C2E",
  textDim: "#56657A",
  background: "#F4F6F9",
  /** Raised surfaces: cards, the search field, sheets. */
  surface: "#FFFFFF",
  /** Recessed fills inside a card, e.g. the raw prerequisite text. */
  surfaceAlt: "#EDF1F6",
  separator: "#E1E6ED",
  border: "#C3CCD8",

  /** Links, buttons, selected filters. */
  tint: "#1F4F91",
  tintSoft: "rgba(31, 79, 145, 0.10)",
  /** Stars and other things the user has picked out. */
  star: "#C99A1E",
  /** Completed courses and met prerequisites. */
  success: "#1E8455",
  successSoft: "rgba(30, 132, 85, 0.12)",
  /** Unmet prerequisites: something still to do. */
  warning: "#A86400",
  warningSoft: "rgba(221, 150, 30, 0.15)",
  error: "#C0341D",
  shadow: "rgba(15, 28, 46, 0.08)",
  overlay: "rgba(15, 28, 46, 0.5)",
  white: "#FFFFFF",

  /** The navy band at the top of each screen, and what sits on it. */
  hero: "#163A6B",
  onHero: "#FFFFFF",
  onHeroDim: "rgba(255, 255, 255, 0.72)",
  /** Translucent fills on the band: round buttons, pills, stat tiles. */
  heroRaised: "rgba(255, 255, 255, 0.14)",
  heroLine: "rgba(255, 255, 255, 0.08)",
  heroAccent: "#EBCF7A",
  heroSuccess: "#6FD39F",
} as const
