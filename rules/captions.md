# Captions — the word-perfect tracer

Two systems; pick per format. Both use **Montserrat 800** on a dark pill —
captions are reading UI, not chalk art.

## 1 · Karaoke word tracer (`templates/KaraokeCaptions.tsx`) — the quality bar

Shows only the current ≤6-word chunk and highlights the exact word being
spoken, from REAL whisper word timings (`rules/pipeline.md` steps 1–2). This is
what makes subtitles feel "perfect" — the tracer never drifts because it never
guesses.

Behaviour worth preserving when adapting:

- Chunk appears `lead=160ms` before its first word (readers need a head start);
  fades in over 180ms; fades out 110–130ms before the next chunk takes over.
- Active word: dark text on a bright chip (`activeColor`), plus a scale pop
  `1 + 0.16·e^(−(t−wordStart)/110ms)` — it lands, then relaxes.
- Spoken words stay at 0.92 opacity; unspoken dim to 0.45 — the eye always
  knows where the voice is.
- Pill: `rgba(10,12,13,0.78)`, radius 20, maxWidth ~940, wrap-centred,
  soft shadow. Size ~54px vertical, ~32px inside a landscape stage.
- Chunking: ≤6 words, break on sentence end, or clause end at ≥4 words
  (`templates/build-words.mjs`). Never split a number from its unit.

## 2 · Pill captions with placement overrides (`templates/Captions.tsx` + `caps.ts`)

Sentence-level captions (`buildCaptions([{text, from, to, keys, place}])`,
ms-timed) with `keys` phrases highlighted on a mark chip. Used where word-level
tracking is overkill (landscape stage) or captions are hand-written summaries.

**Self-adjusting placement** — the part that keeps views unblocked: each
caption may carry a `place` override `{bottom | top, size}` so an individual
caption dodges whatever its moment shows:

- default: bottom of the region (`bottom: 70` split-screen, `bottom: 460`+
  full-screen vertical);
- a diagram fills the lower half → `place: { top: 120 }` for those captions;
- a tight gap → `place: { size: 36 }` (may go under the global 44px floor).

## Placement law (all systems)

1. **Never over a face.** Not the host's, not the Stickman's.
2. **Never in the platform dead zone** — bottom ~420px of a 1920-tall vertical
   frame (X/TikTok/Reels UI). Hence `bottom: 470` full-screen.
3. **Never over the hero visual.** Move the caption, not the visual.
4. One caption at a time; no stacking.

## Verification

Still-render 3–4 frames mid-caption and check: the highlighted word is the one
being spoken (scrub audio), the pill clears every drawn element, and no caption
line-wraps to >2 lines (shorten chunks if so).
