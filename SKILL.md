---
name: ht-chalkboard-video
description: Create or revoice Chinese chalkboard-style Remotion explainer videos with Fish Audio narration, word-timed captions, hand-drawn animation, and quiet SFX. Use for blackboard explainers, animated timelines, AI knowledge videos, voice-only chalk videos, or narration replacements where the voice must remain at its native speed and the video timeline should be edited to match.
---

# HT Chalkboard Video

Create the same visual style as `chalkboard-video`, with one intentional
override: generate narration through Fish Audio using the configuration in
[references/voice.md](references/voice.md).

## Base workflow

1. Locate and read the installed `chalkboard-video/SKILL.md`. Check
   `$CODEX_HOME/skills/chalkboard-video/SKILL.md`, then
   `~/.codex/skills/chalkboard-video/SKILL.md`.
2. Follow every visual, animation, transcription, caption, SFX, layout, and
   verification rule from that skill without modification.
3. Override only narration generation with the configuration in
   [references/voice.md](references/voice.md).

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

Validate the base project as required by `chalkboard-video`, then verify:

- Fish voice is the only narration source.
- Narration remains at native Fish speed and pitch.
- Scene cuts, captions, animation cues, and SFX follow the regenerated
  narration timestamps.
- Audio decodes without errors and does not clip.
