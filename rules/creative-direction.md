# Creative Direction — translating speech into animation

This is the core skill. Anyone can make text appear when words are spoken.
The craft is choosing WHAT to draw and HOW it moves so the animation *is* the
explanation, not decoration next to it.

## The director's loop (per board)

For every 6–15s beat of the transcript, answer these five questions IN ORDER:

1. **What is the ONE idea?** If the beat has two ideas, split the board.
2. **What is the hero visual?** One dominant image the eye lands on. Everything
   else is supporting cast. A board with four equally-loud diagrams is a failed board.
3. **What is the metaphor?** Prefer a concrete physical stand-in over an
   abstract diagram (see the metaphor tables below). "The pool" is a box coins
   live in, not a labelled rectangle.
4. **What moves, and when?** Motion is meaning. Each movement should start at
   the word that names it (real transcript timestamps, not guesses).
5. **What is the payoff?** The last 1–2s of a board should land something: a
   number settles, a stamp slams, a scale tips, a bar falls short. Don't just fade out.

## Nouns → objects

| Spoken concept | Draw |
|---|---|
| store / pool / container / database | a chalk box things visibly live inside (coins, docs); DB = cylinder |
| money / tokens / assets / data items | coins with a glyph (Ξ, $, %) — they can arc, drop, spin, stack |
| fee / reward / accumulation | a jar that visibly FILLS over time — and keeps its fill level across boards |
| ownership / share / percentage | a pie that sweeps open + a "receipt" token stamped with the % |
| user / person / actor / "you" | the Stickman (poses: wave, point, think, shrug, sit) |
| many users / "thousands of people" | a staggered crowd of small stickmen rippling in from the centre |
| request / message / transaction | a dot or coin travelling along an arrow (the arrow's `pulse`) |
| server / service / process | a box with a small activity blinker; racks = stacked boxes |
| price / external market force | a floating price-tag that pulses/breathes — it's alive, unlike static labels |
| growth / progress / value | a bar or curve that draws upward; counters that roll up |
| loss / danger / bug | ALWAYS the same "danger" hue; dashed outlines; a chunk visibly missing |
| a rule / formula / invariant | write it big in monospace, then keep it small in a corner while it applies |
| choice / trade-off / "vs" | a balance scale that tips, or two bars side by side |
| time passing | a jar filling, a counter climbing, sun/moon arc, stacking tally marks |
| a system / architecture | boxes + labelled arrows — but reveal it in narration order, never all at once |

## Verbs → motions

| Spoken verb | Motion |
|---|---|
| deposit / add / insert | object DROPS in with `Easing.out(Easing.back(2))` overshoot + soft pop SFX |
| withdraw / remove | object lifts/arcs out; the container's fill visibly decreases |
| swap / trade / exchange | two objects arc past each other through the container, looping while spoken |
| earn / accumulate | small objects stream one-by-one into the jar; fill level rises slowly |
| burn / destroy / delete | shrink + fade + flames (wavy triangle paths) + embers flying out radially |
| grow / increase / jump | scale/height interpolates up; number rolls up with `useCountUp`; pitch-matched SFX |
| drop / crash / fail | fall with gravity (`y += g·t²`), impact shake (`useImpactShake`) + ONE soft thud |
| split / distribute | pie sweeps; or one stream forks into N with staggered delays |
| rebalance / converge | a point SLIDES along the constraint curve (draw the curve first, then move on it) |
| compare ("but if you had…") | second bar/column draws next to the first; the GAP gets its own bracket + label |
| becomes permanent / locks in | a rotated rubber STAMP slams down: scale 1.6→1, opacity 0→1 over ~0.4s |
| think / wonder / "why?" | Stickman in `think` pose + a thought bubble; question mark pops |
| connect / depend on | arrow draws from A to B (never pre-drawn), then pulses while relevant |
| search / look up | magnifying lens sweeps; matched item lights up while the rest dim |
| "and so on…" | a sweep restores all dimmed items to full brightness in a fast stagger |

## The five quality multipliers

These are what separate a good video from a template video:

1. **Persistent props.** If the fee jar appears in board 2, it comes back with its
   level PRESERVED in boards 3 and 10. The viewer tracks the story through objects.
   Plan prop continuity across the whole beat map before building anything.
2. **One hue per concept.** Assign each core concept a colour at the start
   (see `theme.ts`) and never reuse a hue for a different meaning. The viewer
   should be able to answer "what does amber mean in this video?" instantly.
3. **Numbers are characters.** Real numbers roll up (`useCountUp`) in monospace
   and SETTLE — don't just print them. A painful number can land with a small
   impact shake. The final settled value holds long enough to read.
4. **Dim, don't remove.** When narration walks a table/list, the named row gets
   a chalk frame + full brightness and the rest dim to ~0.38 opacity. Draw the
   FULL structure first, then walk it — the viewer sees scope, then detail.
5. **Contrast beats size.** Emphasis comes from being the only moving/bright/
   coloured thing, not from being huge. Freeze everything else during the payoff.

## Emotional register → treatment

Match the animation's energy to the narration's tone, one notch UNDER it
(the voice carries emotion; animation confirms it):

- **curious / setup** — gentle draw-ons, reveals, idle sway. No shakes.
- **building an argument** — steady accumulation: things fill, stack, count up.
- **the problem appears** — danger hue enters, dashed lines, a prop breaks
  or falls short; at most one soft thud.
- **the twist / punchline** — stop everything else, then ONE decisive motion
  (stamp, scale tip, gap bracket). Give it a beat of stillness after.
- **resolution** — bright hue returns, scale settles, a small ding.

## Anti-patterns (these were tried and cut)

- Text-only boards (a caption is not a visual).
- Everything animating at once; motion without a spoken cue.
- Dramatic risers/booms/sparkle SFX on ordinary reveals (see `rules/sound.md`).
- Background music beds under speech (buzzes, annoys — cut from real videos).
- Wobble/boil on organic or precise things: people, clouds, planets, charts and
  tables are CLEAN; only boxes/arrows may keep the hand-drawn boil.
- Reusing a concept colour for a new meaning mid-video.
- Pre-drawn diagrams that sit fully visible before the narration reaches them.
