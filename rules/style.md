# Style — the chalkboard visual language

## Surface

`templates/ChalkBg.tsx` is the board: slate `#222A2B` with a soft radial light
toward the upper third, 2–3 blurred "wear" patches (erased-chalk ghosts),
animated `feTurbulence` grain at 6% overlay, and a vignette. Render it as the
first child of every scene. Frame background behind panels: `#1B2122`.

## Line & colour

- Chalk primary `#EEE9DC`; secondary/annotation `rgba(238,233,220,0.6)` (DUST).
- Stroke widths: 4–5px main lines, 2.5–3px annotations/dashes, `strokeLinecap:
  "round"` everywhere — chalk has no sharp ends.
- Concept palette in `templates/theme.ts` — **one hue per concept for the whole
  video**. 3–6 concept colours max; more reads as noise.
- Fills are rare: use `${hue}22`–`${hue}33` translucent fills inside outlined
  shapes; solid fills only for small objects (coins, dots).

## Two line dialects — and when to use each

1. **Rough kit** (`templates/Rough.tsx`) — vertices jittered by a seeded hash,
   re-rolled every 5 frames ("chalk boil", `templates/wobble.ts`). Lines shimmer
   like a living chalk drawing. Use for: boxes, arrows, containers, circled
   emphasis — the "hand-drawn diagram" vocabulary.
2. **Clean kit** (`templates/CleanKit.tsx`) — ruler-straight, still draws on.
   Use for: people (the Stickman is clean-line by default), organic shapes (clouds,
   planets), charts, plots, tables, anything precise or anything organic.

House rule (hard-won user feedback): **organic and precise things are clean;
only boxes/arrows keep the boil.** Boil on a face or a chart looks broken, not charming.

## Typography

- **Board handwriting: Kalam** (`@remotion/google-fonts/Kalam`, 400/700) — all
  labels, headlines, annotations.
- **Numbers & code: monospace** (`ui-monospace, Menlo`) — amounts, formulas,
  hashes, counters (`fontVariantNumeric: "tabular-nums"` for roll-ups).
- **Captions: Montserrat 800** — never Kalam; captions are a reading UI, not art.
- Headline ~62px, body 34–46px, annotations 28–34px (at 1080-wide). Keep 70px
  side margins.

## Motion grammar

- Nothing pops into existence: shapes **draw on** (`pathLength/strokeDash`
  0→1 over 16–20 frames), text **fades + spring-rises** (`useReveal`), objects
  **drop/scale in** with `Easing.out(Easing.back(2))`.
- Standard easing for camera/layout moves: `Easing.bezier(0.16, 1, 0.3, 1)`.
- Stagger sibling elements 4–9 frames apart — a hand draws one thing at a time.
- Idle life: characters sway/blink; key values breathe (±5% scale sine); an
  arrow in use pulses a travelling dot. A fully static board reads as a slide.
- Reveal in narration order. The board builds as the sentence unfolds.

## Layout discipline

- One hero zone (usually centre / upper-centre), headline at top, running
  annotation lines lower — but NEVER inside the caption band or platform dead
  zones (`rules/captions.md`).
- Persistent props keep their screen position across boards when possible
  (the jar lives right-of-centre in every board it appears in).
