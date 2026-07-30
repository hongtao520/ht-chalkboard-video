import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

/**
 * A one-shot sound effect that starts playing at an absolute frame within the
 * current Sequence (i.e. relative to the scene it lives in). Renders no visuals.
 *
 * ALL files live in public/sfx/gen/ and are produced by the synth engine —
 * run `node scripts/synth.mjs sfx` ONCE per project before using this
 * component (copy synth.mjs from the skill templates into scripts/).
 * Everything is mixed quietly so it sits under the host's voice.
 */
export type SfxName =
  // chalkboard palette (the defaults — see rules/sound.md)
  | "chalk-draw"
  | "chalk-arrow"
  | "chalk-write"
  | "pop-soft"
  | "ding-soft"
  | "whoosh-short"
  | "gear-whir"
  | "zip-close"
  | "sparkle"
  | "footstep"
  // extended library
  | "ui-pop"
  | "ui-click"
  | "ui-success"
  | "ui-error"
  | "ui-toggle"
  | "impact-thud"
  | "impact-boom"
  | "impact-punch"
  | "impact-glass"
  | "trans-riser"
  | "trans-downlifter"
  | "trans-whoosh-soft"
  | "trans-whoosh-fast"
  | "trans-sub-drop"
  | "tech-typing"
  | "tech-beeps"
  | "tech-data"
  | "tech-glitch"
  | "tech-notify"
  | "tech-scan";

/** Sensible default level per effect so calls stay terse. */
const DEFAULT_VOLUME: Partial<Record<SfxName, number>> = {
  "chalk-draw": 0.4,
  "chalk-arrow": 0.4,
  "chalk-write": 0.32,
  "pop-soft": 0.45,
  "whoosh-short": 0.4,
  "gear-whir": 0.3,
  "zip-close": 0.5,
  "ding-soft": 0.45,
  "impact-thud": 0.55,
  "impact-boom": 0.5,
  "impact-punch": 0.5,
  "trans-sub-drop": 0.5,
  footstep: 0.35,
};

/**
 * Global gain applied to every SFX so they sit well under the host's voice.
 * Lower this single number to make all effects quieter (or raise to bring back).
 */
const SFX_GAIN = 0.35;

export const Sfx: React.FC<{ at: number; name: SfxName; volume?: number }> = ({ at, name, volume }) => {
  if (at < 0) return null;
  const vol = (volume ?? DEFAULT_VOLUME[name] ?? 0.4) * SFX_GAIN;
  return (
    <Sequence from={at} layout="none" name={`sfx:${name}@${at}`}>
      <Audio src={staticFile(`sfx/gen/${name}.mp3`)} volume={() => vol} />
    </Sequence>
  );
};

/** Fire the same effect at several frames (e.g. a row of boxes drawing on). */
export const SfxAt: React.FC<{ ats: number[]; name: SfxName; volume?: number }> = ({ ats, name, volume }) => (
  <>
    {ats.map((at, i) => (
      <Sfx key={`${name}-${i}-${at}`} at={at} name={name} volume={volume} />
    ))}
  </>
);
