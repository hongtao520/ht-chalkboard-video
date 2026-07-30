---
name: ht-chalkboard-video
description: Create or revoice Chinese chalkboard-style Remotion explainer videos with Fish Audio narration, word-timed captions, hand-drawn animation, and quiet SFX. Use for blackboard explainers, animated timelines, AI knowledge videos, voice-only chalk videos, or narration replacements where the voice must remain at its native speed and the video timeline should be edited to match.
---

# HT Chalkboard Video

Create a complete Chinese chalkboard explainer with the bundled Remotion
templates, visual rules, captions, SFX, and Fish Audio narration. This skill is
self-contained and must not call or read another installed skill.

## Core workflow

1. Read [rules/creative-direction.md](rules/creative-direction.md) and
   [rules/pipeline.md](rules/pipeline.md).
2. Generate Fish narration with [references/voice.md](references/voice.md).
3. Transcribe that exact audio and build word-timed caption chunks with the
   bundled `templates/transcribe.mjs` and `templates/build-words.mjs`.
4. Split the transcript into 6–15 second boards and design one visual idea per
   board.
5. Build from the bundled Remotion templates. Use
   [rules/style.md](rules/style.md), [rules/layouts.md](rules/layouts.md),
   [rules/primitives.md](rules/primitives.md), and
   [rules/characters.md](rules/characters.md) as needed.
6. Add captions and quiet scene-matched SFX using
   [rules/captions.md](rules/captions.md) and [rules/sound.md](rules/sound.md).
7. Type-check, render representative stills, inspect them, then render the
   final video.

Start new projects from `templates/ExampleVideo.tsx`; copy only the required
templates into the project. All animation must be a deterministic function of
`useCurrentFrame()`. Never use CSS animation, wall-clock time, `Math.random()`,
or `Date.now()`.

## Generate narration

Before production, check Fish credentials:

```bash
python3 scripts/configure_fish.py --check
```

If Fish is missing, stop and ask the user to run:

```bash
python3 scripts/configure_fish.py
```

Never request or print the API key in chat.
This helper reads and updates this skill's private `.env` file.

Generate one narration file:

```bash
python3 scripts/fish_narrate.py \
  --text-file narration.txt \
  --output public/audio/narration.mp3
```

## Sync rules

- For a new video, generate Fish narration first, then transcribe that exact
  audio with Whisper and build the animation/captions from its timestamps.
- Keep Fish prosody speed at `1.0`. Never use `atempo`, `playbackRate`, pitch
  shifting, time stretching, or target-duration fitting on narration.
- For a narration replacement, re-transcribe the generated voice, move scene
  boundaries and animation cues to the new word timestamps, and change the
  video duration when needed. Edit the picture to the voice, not the voice to
  the picture.
- Keep the original narration text exactly unless the user asks for rewriting.
- Keep one voice for the whole film.
- Store Fish credentials only in this skill's `.env` with mode `0600`.

## Verification

Run `npx tsc --noEmit`, render and inspect key stills, then verify:

- Fish voice is the only narration source.
- Narration remains at native Fish speed and pitch.
- Scene cuts, captions, animation cues, and SFX follow the regenerated
  narration timestamps.
- Audio decodes without errors and does not clip.
