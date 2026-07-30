/**
 * Shared chalk "boil" used by every hand-drawn primitive (RoughBox, RoughEllipse,
 * the Stickman rig, …). Keeping it in one place means strokes across the whole
 * video shimmer with the same character.
 */

export const wobble = (seed: number, i: number) => {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 6;
};

/** Adds a small, slowly-changing "boil" so hand-drawn strokes look alive (re-rolls every 5 frames). */
export const liveWobble = (seed: number, i: number, frame: number) => {
  const boil = Math.floor(frame / 5);
  return wobble(seed, i) + wobble(seed + boil * 1.3 + 11, i) * 0.4;
};

/**
 * Build an SVG path `d` from a polyline, jittering every vertex with the chalk
 * boil. Subdivide a straight segment (pass extra in-between points) so the
 * middle bows slightly and reads as hand-chalked rather than ruler-straight.
 */
export const roughPath = (
  pts: ReadonlyArray<readonly [number, number]>,
  seed: number,
  frame: number,
  roughness = 1,
  close = false,
) => {
  const d = pts
    .map(([px, py], i) => {
      const wx = liveWobble(seed, i, frame) * roughness;
      const wy = liveWobble(seed + 7, i, frame) * roughness;
      return `${i === 0 ? "M" : "L"} ${px + wx} ${py + wy}`;
    })
    .join(" ");
  return close ? `${d} Z` : d;
};

/** Subdivide a straight bone into `segs` segments so its midpoints can wobble. */
export const subdivide = (
  a: readonly [number, number],
  b: readonly [number, number],
  segs = 3,
): Array<[number, number]> => {
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
};
