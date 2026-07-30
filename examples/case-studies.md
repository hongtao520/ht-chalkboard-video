# Case Studies — annotated real boards

Patterns lifted from shipped videos. Steal the structure, not the topic.

## 1 · The LP/impermanent-loss reel (the subtitle + metaphor gold standard)

A 122s audio-only vertical reel explaining liquidity providing. Why it works:

**Concept colours assigned once**: blue=ETH, green=USDC, amber=fees, teal=LP
ownership, coral=loss, violet=price. Every board obeys them.

**Board-by-board direction** (note the noun→object, verb→motion choices):

- *"Who fills the box?"* — hero: the pool box; a waving Stickman with an "LP"
  chip that DROPS onto his head with back-ease. On "thousands of them, over
  time": a crowd ripples in behind him, rows shrinking/fading with distance.
- *"To earn fees"* — a trade LOOPS through the box (coin arcs in, coin arcs
  out, every 40 frames while spoken) and each pass skims a small amber % coin
  that flies into a **fee jar**. The jar is the video's persistent prop.
- *"0.3% per trade"* — the number HUGE in mono (150px). Volume = coins zipping
  by + a live `trades:` counter rolling up. The same jar, filling faster.
- *"You get an LP token"* — deposit box → arrow (with pulse) → a teal receipt
  token; then a pie sweeps open to 10% while the label explains.
- *"Burn it to cash out"* — the token SHRINKS + fades under wavy chalk flames
  with embers arcing out, then coins drop back out of an arrow. Verb literalized.
- *"ETH jumps to $4,000"* — the constant-product CURVE is drawn, the position
  point SLIDES along it while arb coins repeatedly hop out; a live reserves
  readout updates `10.00→7.07`. The price tag breathes (±5% scale sine).
- *"Withdraw vs. HODL"* — two bars race up; the withdraw bar SINKS back; the
  shortfall becomes a dashed ghost box + a bracket labelled −$3,432.
- *"Impermanent loss"* — the arithmetic lands line by line, then on
  "…permanent" a coral **PERMANENT stamp slams down rotated −8°** (scale
  1.6→1). The single best remembered frame of the video.
- *"So why be an LP?"* — a balance scale: the SAME fee jar (still full) on one
  pan vs a coral loss coin on the other; the beam TIPS toward fees as the
  narration concludes. Payoff = the whole video's props on one scale.

**Captions**: karaoke word tracer, ≤6-word chunks, `bottom: 470`, active word
on an amber chip with a scale pop. **SFX**: ~2 per board, all chalk/pop/ding,
one soft thud on each stamp.

## 2 · Full-table narration (landscape, "reference card" beats)

For "here are the numbers you memorize" beats: render the COMPLETE table up
front (viewer sees scope), then walk it with the voice — the named row gets a
chalk frame + full brightness, all others dim to 0.38; on "and so on" a fast
stagger sweeps every row back to bright. Do this in a `fullWindows` full-screen
zoom (`WideStage`) so the table owns the frame; the face-cam exits for it.

## 3 · Zoom-into-world (creative transitions)

"Every project starts as a book" → the camera scales INTO the book's cover at
its transformOrigin, crossfading to a world inside; later, into a monitor on a
desk. Chain: world → object → new world. Add an expanding-ring wormhole for
longer dives. Used to turn a listicle script into a continuous journey.

## 4 · The leap of faith (finale cinematics)

Rooftop edge → 180° rotating dive → a scrolling canyon of buildings whose
layers move at different parallax speeds → speed streaks → knowledge chips
streaming past on a wrapped scroll → radial spark burst on the rise. All 2D
transforms; reads as full 3D. Reserve this scale of sequence for a series
finale or trailer.

## 5 · Split-screen whisper-synced talking head

A 12-scene Git internals video: each re-edited host clip gets a scene component
with a `T = {trigger: sec(word_time)}` map at top, commented with the exact
spoken words — every chalk element starts on its word. Scenes glue with
`<Series>`, trimmed to the last spoken word so speech flows across hard cuts.

## 6 · Persistent concept map (series glue)

A small fixed-position "build map" tree in a corner, shared ACROSS videos: node
positions are constant; each episode passes `{nodeId: revealFrame}` and the map
keeps growing over the series. Viewers see the curriculum assemble. Never fork
the layout — extend it.
