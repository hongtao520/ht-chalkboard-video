# Primitives — the drawing kits

Copy the templates; don't re-derive. This file explains how they work and how
to extend them.

## Chalk boil (`templates/wobble.ts`)

```ts
wobble(seed, i)            // deterministic jitter per vertex, ±3px
liveWobble(seed, i, frame) // + a second jitter re-rolled every 5 frames — the "boil"
roughPath(pts, seed, frame, roughness, close) // polyline → jittered SVG path d
subdivide(a, b, segs)      // split a straight bone so its middle can bow
```

The 5-frame re-roll is the magic number: faster looks like noise, slower looks
static. Always pass different `seed`s to sibling shapes.

## Rough kit (`templates/Rough.tsx`)

- `RoughBox` — 5-point jittered rectangle, draws on over ~20 frames after `delay`.
- `RoughArrow` — quadratic-bezier arrow (`curve` bows it); head appears at 85%
  draw progress; `pulse` loops a fading dot along the curve (data flowing) —
  the single most-used "something travels" device.
- `RoughEllipse` — 24-segment jittered ellipse (circling something for emphasis).
- `RoughCircle` — filled dot that scales in.
- `RoughStroke` — free polyline; the building block for bespoke sketch art.

All: absolute-positioned full-bleed SVG with `overflow: visible`, so
coordinates are frame-global; compose freely.

## Draw-on mechanics (used everywhere)

```tsx
<path pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
// p = interpolate(frame, [delay, delay + 20], [0, 1], clamp)
```

`pathLength={1}` normalizes any path so dash math is trivial.

## Clean kit (`templates/CleanKit.tsx`)

`Line` (polyline draw-on, `dashed` option), `Reveal` (fade + spring-rise text),
`Head` (board headline), `Dot`, `Fade`, `Board` (a time-windowed, cross-fading
`Sequence` — the unit of composition), plus `sec()/ip()/polyD()/useDraw()`.

## Building objects from primitives

The vocabulary is composition, not clip-art. Proven recipes:

- **Coin**: circle + translucent fill + a glyph (Ξ, $, %) centred; `dropFrom`
  for a drop-in; `spin` = `scaleX = |cos(f·0.1)|`.
- **Jar**: RoughBox open at top + a fill rect whose height interpolates; label
  under. The fill level is a prop you thread across boards.
- **Pie**: arc-sweep path from 12 o'clock, `A` arc with `large-arc` flag from
  the sweep angle; translucent fill.
- **Receipt token**: two concentric circles (outer solid, inner dashed at 60%
  opacity) + centred text.
- **Flames**: 3–4 teardrop paths (`Q` curves), heights oscillating with
  `sin(f·0.4 + phase)`, drawn in the danger + accent hues at 44% fill.
- **Embers/particles**: position = pure function of (index, frame): radial
  `pos = origin + dir·v·t + [0, g·t²]`, radius and opacity decay with progress.
- **Stamp**: rotated (−8°) bordered pill, `scale: 1.6→1` + `opacity: 0→1` over
  ~12 frames — slams down.
- **Balance scale**: three `Line`s (post, beam, base); tipping = ±`tip·6` px on
  the beam ends, pans follow.
- **Plot/curve**: define `sx()/sy()` scale helpers over a data range, sample the
  function into ~60 points, draw with `Line`. Points get dashed guide lines to
  the axes. A moving point = interpolate the x through the range and evaluate.
- **Icons** (CPU, server rack, folder, trash, robot, lightbulb, thought cloud):
  hand-build once from `Line`/`RoughStroke` polylines at a fixed local size,
  wrap in a scalable `<g>`; keep a per-project icon file and reuse.

## Live values

- `useCountUp(delay, dur, to, from)` — numbers climb and settle (ease-out cubic).
  Format with `toLocaleString()`; render in monospace.
- Re-rolling value ("code changes constantly"): `hash(Math.floor(frame/N))` →
  pick from a list every N frames.
- `useImpactShake(at, amp, dur)` — decaying incommensurate sines; spread
  `{x, y, rot}` onto the container transform on crash/landing beats.
