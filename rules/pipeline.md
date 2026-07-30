# Pipeline — raw clip to rendered video

## 0 · Inspect the raw material

```bash
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 public/raw/clip.mov
```

Note duration, whether there's usable video (talking head) or audio only —
this decides the layout (`rules/layouts.md`).

## 1 · Transcribe (ALWAYS — never trust a provided script)

People improvise when recording. A "rough script" is stale the moment the mic
turns on. Use `templates/transcribe.mjs` (adapts `@remotion/install-whisper-cpp`):

- model `small.en`, `tokenLevelTimestamps: true`
- ffmpeg the clip to 16kHz mono wav first
- output: `<clip>.captions.json` (token-level) + a human-readable line list

Skim the transcript for whisper mistakes on technical terms (e.g. "SHA-1" →
"shall one") and fix the TEXT in the data — keep the timings.

## 2 · Build word-level caption chunks

`templates/build-words.mjs`: merges whisper sub-word tokens into whole words,
then groups into chunks of **≤6 words**, breaking at sentence ends (`.!?`) and
at clauses (`,;:`) once a chunk has ≥4 words. Output is a generated TS data
file: `{ s, e, words: [{t, s, e}] }[]` in ms. This drives the karaoke tracer.

## 3 · Beat map

Write the beat table before any code. One row per board:

```
b1  0.00–12.60   "who fills the box? → an LP"        hero: box + waving stickman   props: LP tag, crowd @5.9s
b2  12.60–20.80  "they earn fees on every trade"      hero: swap loop + fee jar     props: jar (persists!)
...
```

Rules: boards are 6–15s; each board is ONE idea; note which props persist
across boards; mark the payoff moment of each board. Then run the director's
loop from `rules/creative-direction.md` on every row.

## 3.5 · One-time project prep

- Copy the needed templates into `src/` (kits, ChalkBg, captions, Sfx, theme)
  and `scripts/` (transcribe/build-words/synth).
- **Generate the SFX library**: `node scripts/synth.mjs sfx` → `public/sfx/gen/`
  (all `SfxName`s resolve to these files; skipping this = silent 404s at render).

## 4 · Compose

`templates/ExampleVideo.tsx` is a complete working skeleton of everything
below (boards + rough/clean kits + stickman + counter + stamp + SFX + karaoke
captions) — start from it. Structure that has proven out (see
`examples/case-studies.md`):

```tsx
export const MyVideo: React.FC = () => {
  const w = { b1: [sec(0), sec(12.6)], b2: [sec(12.6), sec(20.8)], /* … */ } as const;
  return (
    <AbsoluteFill style={{ background: SLATE_DEEP }}>
      <ChalkBg />
      <Audio src={staticFile("raw/clip.mov")} />
      {/* SFX beats — see rules/sound.md */}
      <Sfx at={w.b1[0]} name="chalk-draw" />
      {/* boards */}
      <Board from={w.b1[0]} to={w.b1[1]}><B1 /></Board>
      <Board from={w.b2[0]} to={w.b2[1]}><B2 /></Board>
      <KaraokeCaptions chunks={CHUNKS} bottom={470} size={54} />
    </AbsoluteFill>
  );
};
```

- Each board is a component (`B1`, `B2`…) whose frame 0 is the board's start —
  time everything inside with `sec()` **relative to the board**.
- Element trigger times come from the transcript word times: the arrow that
  illustrates "hands you back your share" starts on "hands", not roughly nearby.
- Multi-scene talking-head videos: one component per re-edited clip scene, glued
  with `<Series>`; trim each to just after its last spoken word so speech flows
  across cuts.

### Re-syncing after a clip re-edit

If the host re-edits/trims the clip: re-transcribe, diff the word times, and
shift each board window / trigger by the local offset. Never re-time by ear.

## 5 · Verify — by looking, not by compiling

1. `npx tsc --noEmit` (and eslint if configured).
2. Still-render every board's payoff frame and LOOK at the image:
   `npx remotion still <comp-id> --frame=N --scale=0.4 /tmp/f.png`
   Check: hero visual dominant? captions clear of content? colours on-concept?
   text inside safe margins?
3. Preview timing-sensitive beats in Studio (`npx remotion studio`) or render a
   short range: `npx remotion render <id> --frames=120-300 /tmp/beat.mp4`.
4. Full render: `npx remotion render <id> out/<id>.mp4`. For 3D-heavy comps
   budget minutes, and still-check single frames first.

Real bugs are caught at step 2 (over-blurred dolly, unreadable spotlight,
PiP off-frame) — never skip the looking.

## Determinism checklist (breaks renders if violated)

- No `Math.random()`, `Date.now()`, `performance.now()`, CSS animation/transition.
- 3D: no `useFrame`; set camera/bones from `useCurrentFrame` each render; async
  loads need `delayRender`/`continueRender` with a deterministic capture.
- Children of `@remotion/motion-blur` `<Trail>` must call `useCurrentFrame()`
  themselves, or all echo copies render identically.
- Audio-viz children inside offset `<Sequence>`s must receive the parent's
  frame as a prop, not call `useCurrentFrame()` per child.
