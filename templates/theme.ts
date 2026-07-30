// Shared visual language. Rule: ONE hue per concept — never reuse a concept
// colour for a different meaning within a video (or a series).

export const SLATE = "#222A2B"; // chalkboard surface
export const SLATE_DEEP = "#1B2122"; // frame background behind the board
export const CHALK = "#EEE9DC"; // primary chalk line / text
export const DUST = "rgba(238,233,220,0.6)"; // secondary / de-emphasized text
export const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Soft highlight used by captions (a reading aid, not a concept colour). */
export const MARK = "rgba(242,208,107,0.30)";

/**
 * Concept palette — assign each video's 3–6 core concepts a hue at the start
 * and keep it for the whole video. Example assignment from a DeFi explainer:
 * blue = asset A, green = asset B, amber = fees/reward, teal = ownership,
 * coral = loss/danger, violet = price/external force.
 */
export const C = {
  blue: "#7FB0E0",
  green: "#7BC67E",
  amber: "#F2D06B",
  violet: "#B79CE0",
  coral: "#E8857A",
  orange: "#F0A35C",
  teal: "#6FC2B0",
  grey: "#AEB6B7",
} as const;

/* ---- format tokens (vertical reel defaults; see rules/layouts.md) ---- */
export const W = 1080;
export const H = 1920;
export const FPS = 30;
/** Vertical split-with-host: graphics occupy the top SEAM px, host below. */
export const SEAM = Math.round(H * 0.56);
export const HOST_H = H - SEAM;

export const sec = (s: number) => Math.round(s * FPS);
