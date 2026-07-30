# Sound — quiet, scene-matched, never dramatic

Hard-won rules from real feedback. The voice is the star; sound design confirms
what the eye sees and nothing more.

## The rules

1. **No background music under speech.** Synth beds were tried and CUT — they
   buzz and annoy. Ship voice + quiet SFX. (Music is acceptable only for
   speech-free intros/trailers, and even then ask.)
2. **SFX match the scene physically.** Drawing → chalk sounds; a reveal → a
   soft pop; an answer landing → a soft ding; a transition → a short whoosh;
   something literally falling → ONE soft thud. That's nearly the whole palette.
3. **Risers, booms, sparkles, sub-drops on ordinary beats: no.** They were
   tried and cut. Reserve an impact for something that visibly crashes.
4. **Mix low.** Per-effect defaults ~0.3–0.55, times a global gain ~0.35 —
   effects sit clearly UNDER the voice. When unsure, quieter.
5. Density: ~2 SFX per board (one on the draw-on, one on the payoff). More
   reads as a slot machine.

## Setup — generate the library first

No SFX files ship with a fresh project. Copy `templates/synth.mjs` into
`scripts/` and run **`node scripts/synth.mjs sfx`** once — it deterministically
synthesizes all 30 effects (the chalk palette + ui/trans/impact/tech sets) into
`public/sfx/gen/`. Every name in `Sfx.tsx` maps to one of these files. Requires
ffmpeg on PATH.

## Usage (`templates/Sfx.tsx`)

```tsx
<Sfx at={w.b2[0]} name="chalk-write" />
<Sfx at={w.b2[0] + sec(3)} name="ui-success" volume={0.4} />
<SfxAt ats={[30, 38, 46]} name="pop-soft" />  // a row of boxes drawing on
```

`at` is relative to the enclosing sequence. The component wraps
`<Sequence from><Audio/></Sequence>` with per-name default volumes.

## Palette mapping

| Visual event | SFX |
|---|---|
| shape draws on | `chalk-draw` / `chalk-arrow` |
| text writes | `chalk-write` |
| object pops/drops in, stamp | `pop-soft` (or `ui-pop`) |
| answer/number settles, success | `ding-soft` (or `ui-success`) |
| board transition, camera move | `whoosh-short` (or `trans-whoosh-soft`) |
| something falls/crashes (rare) | `impact-thud` — soft, paired with `useImpactShake` |
| error/rejection | `ui-error` |
| data/tech moment | `tech-notify`, `tech-data` (sparingly) |
| machinery/process churning | `gear-whir` |
| something closes/packs up | `zip-close` |
| magic/highlight glint (rare) | `sparkle` |
| footsteps (walk cycles) | `footstep` on each heel-strike frame |

## Synthesizing the library (no downloads needed)

**ffmpeg one-liners** (`templates/gen-sfx.sh`) — lavfi evaluates audio as math.
Recipe grammar: tone = `sin(2π·f·t)`; pitch sweep = make `f` a function of `t`;
percussive = `·exp(−k·t)`; air/impact = `anoisesrc` + `lowpass/highpass`;
envelope = `afade`.

```bash
# soft pop: short sine blip with fast decay
ffmpeg -f lavfi -i "aevalsrc=0.6*sin(2*PI*620*t)*exp(-22*t):d=0.25:s=44100" pop.mp3
# whoosh: pink noise through a lowpass with fades
ffmpeg -f lavfi -i "anoisesrc=color=pink:duration=0.9:seed=7" -af "lowpass=f=1400,afade=t=in:d=0.25,afade=t=out:st=0.45:d=0.45" whoosh.mp3
```

**Full synth engine** (`templates/synth.mjs` — the canonical source): seeded
PRNG → pure-math WAV → mp3. Provides `tone()` (additive osc + ADSR + vibrato +
slide + one-pole LP), `noise()` (swept filtered noise), `echo()`, kick/snare/
hat, and a bar/beat sequencer. `node synth.mjs sfx` generates all 30 SFX;
`node synth.mjs music` adds 6 ~60s emotion beds (curious/focus/epic/tension/
triumph/wonder) — remember: the beds are for speech-free segments only.
Extend by adding entries to the `SFX` map (chalk sounds are band-passed noise
with stroke-shaped envelopes — see the `chalk-*` entries) or copying a
`music*()` function. Add the matching name to `SfxName` in `Sfx.tsx`.

## Voice track

The raw clip IS the voice track: `<Audio src={staticFile("raw/clip.mov")} />`
(or the `<Video>` in split layouts, unmuted). Never re-encode speech separately
from its video — sync drifts.
