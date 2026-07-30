# Characters — stick figures, crowds, and 3D actors

## The Stickman (`templates/Stickman.tsx`)

A posable chalk figure. Anchor `(x, y)` = HEAD CENTRE; `size` = head-to-foot px.

- **Poses are joint ANGLES, not coordinates** — `idle, wave, point, think,
  shrug, walk, sit` — so they're reusable and blendable
  (`blendFrom`+`blend` lerps between two poses for smooth transitions).
- **Two-bone IK**: `rightHandTarget`/`leftHandTarget` (absolute px) override the
  arm angles and solve the elbow — for "reaching for the diagram" choreography.
- **Walk cycle**: pure function of frame — thighs `sin`, knees bend only on the
  back-swing, arms counter-phase, body bob. Move the whole figure with
  `x = startX + frame·speed` while pose="walk".
- **Face**: expressions (`happy, curious, surprised, thinking, unsure`) set
  brows/mouth/eye-scale; `facing` (−1..1) shifts pupils; `talking` flaps the
  mouth with a two-sine gate; blink every ~3.2s; `idle` adds breathing sway.
- **Draw-on**: staggered — head first, then spine, arms, legs, face fades last.
- `simple` (no face/hands, limbs join the centreline) for background figures.
- **Clean lines by default** (`wobble` is off): the house style keeps people as
  normal straight-line stickmen. Only pass `wobble` for a deliberately sketchy
  one-off figure — never for the narrator or crowds.

Adding a pose: add a `PoseDef` of five limb angle pairs + head tilt + default
expression. Angle convention: degrees, 0 = straight down, positive = screen-right.

## Crowds

"Thousands of users" = 8–12 small `simple` stickmen in 2–3 rows behind the hero:
rows shrink and fade with distance (size 150→96, opacity 0.92→0.5); each pops in
with `Easing.out(Easing.back(1.9))` scale from its own delay; **ripple the delays
outward from the centre** (`delay = start + row·9 + |dx|/40`); alternate
wave/idle poses; per-figure seeds. Tag each with a floating label chip that
drops in with back-ease.

## Making a character the narrator

Place the Stickman at a board edge, `facing` toward the hero visual, `point`
pose when the narration says "this/here", `think` on questions, `shrug` on
"nobody knows", `talking` only if it is the voice's stand-in (audio-only clips).
One character; don't crowd the stage with commentary figures.

## Procedural 3D characters (no model files)

For cinematic beats a full 3D actor can be built from primitives inside
`@remotion/three` — proven patterns:

- **Skeleton = nested `<group>`s**: hip → thigh (rotation=swing) → capsule →
  knee group at bone end (rotation=bend) → shin; same for arms. ~13 bones reads
  as fully articulated.
- **Gait = a pure `gait(frame)` function** returning every joint angle:
  thighs `sin(t)·0.62`, knees `max(0, −sin(t−0.5))`, arms counter-phase,
  bob `|cos t|·0.09`, slight forward lean. One stride ≈ `π/stepFreq` frames.
  Fire a footstep SFX on each heel strike.
- **A robed/hooded figure** avoids hands/feet detail: lathe-geometry robe,
  hood = sphere with a phi-window opening, dark interior sphere + emissive eyes
  floating inside, articulated shoulder+elbow arms. Actions: idle/walk/wave/
  point/cast/float as angle presets driven per-frame.
- Drive `position`/`facing` per frame from a scene-level state function
  (walk in → turn → wave → point → cast) — the character is a plain group.
- Gotchas: keep any face light tiny (intensity ~0.2, distance ~1) or the hood
  glows; outward arm swing on the +x side is a POSITIVE z-rotation; everything
  visible inside a hood must sit in front of the hood surface.

See `rules/camera-shots.md` for cameras, and the two iron laws: never
`useFrame`, pose bones from `useCurrentFrame` every render.
