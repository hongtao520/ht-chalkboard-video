import { FPS } from "./theme";

export type CaptionSeg = { text: string; mark: boolean };

/**
 * Per-caption placement override. Use it to move a caption out of the way when
 * the default spot would cover the host's face, a diagram, or busy animation —
 * "self-adjusting" subtitles. All fields optional; anything omitted falls back
 * to the <Captions> defaults.
 */
export type CaptionPlacement = {
  /** distance from the bottom of the parent region, px (ignored if `top` set) */
  bottom?: number;
  /** distance from the top of the parent region, px — anchors from the top instead */
  top?: number;
  /** font size for this caption (may go below the global floor for tight spots) */
  size?: number;
};

export type CaptionToken = { fromFrame: number; toFrame: number; segs: CaptionSeg[]; place?: CaptionPlacement };

type CaptionInput = {
  /** caption text */
  text: string;
  /** start time in milliseconds */
  from: number;
  /** end time in milliseconds */
  to: number;
  /** words/phrases to highlight */
  keys?: string[];
  /** optional placement override so this caption avoids covering content */
  place?: CaptionPlacement;
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Split a caption into highlighted / plain segments based on `keys`. */
const segment = (text: string, keys: string[]): CaptionSeg[] => {
  if (keys.length === 0) return [{ text, mark: false }];
  const re = new RegExp(`(${keys.map(escape).join("|")})`, "gi");
  return text
    .split(re)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, mark: keys.some((k) => k.toLowerCase() === part.toLowerCase()) }));
};

const msToFrame = (ms: number) => Math.round((ms / 1000) * FPS);

/** Convert ms-timed caption inputs into frame-timed tokens for <Captions />. */
export const buildCaptions = (items: CaptionInput[]): CaptionToken[] =>
  items.map((it) => ({
    fromFrame: msToFrame(it.from),
    toFrame: msToFrame(it.to),
    segs: segment(it.text, it.keys ?? []),
    place: it.place,
  }));
