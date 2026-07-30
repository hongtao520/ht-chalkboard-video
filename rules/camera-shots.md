# Camera & Shots — cinematic moves, 3D, isometric, POV

Use these to ESCALATE: most boards are static-camera chalk. Spend a camera move
or a 3D shot on the 1–3 beats per video that deserve it (the twist, the scale
reveal, the finale). A video that's all camera moves is seasick.

## Virtual camera in 2D (the workhorse)

The board is a filmed set: build a world container LARGER than the frame,
then apply `transform: translate(W/2 − camX·zoom, H/2 − camY·zoom) scale(zoom)`
with `transformOrigin: "0 0"`, where `{camX, camY, zoom}` come from parallel
`interpolate` keyframe arrays (same input range, eased per segment,
`Easing.bezier(0.16,1,0.3,1)`).

- **Push-in** on the payoff; **pull-back** to reveal context ("this box is one
  of a thousand").
- **Whip pan**: fast camX move + blur = f(camera speed): only blur above
  ~40px/frame so slow dollies stay sharp.
- **Impact shake**: decaying incommensurate sines (`useImpactShake`).
- **Rack focus**: two layers crossfading `filter: blur()` — cheap depth of field.
- **Parallax**: background layer translates at ~0.35× camera speed. 3+ layers at
  different speeds = a scrolling canyon/street with real depth.
- **Zoom-into-world**: scale an `AbsoluteFill` at a `transformOrigin` ON an
  object (a book, a monitor) while crossfading to the world inside it. Chain
  these for "dive into the system" sequences; add an expanding-ring wormhole
  between levels.
- **Motion blur**: `@remotion/motion-blur` `<Trail>` (echo copies — children
  must read `useCurrentFrame()` themselves) and `<CameraMotionBlur>`.
- **Transitions**: `@remotion/transitions` fade/slide/wipe/clockWipe between
  Sequences — transitions SHORTEN the total (scenes overlap). Cut on motion:
  whip-pan out of board A into board B on the word "but".

## Isometric / 2.5D (chalk blueprints with depth)

No 3D engine needed:

- **CSS iso projection**: wrap a flat layout in
  `transform: rotateX(57deg) rotateZ(-45deg)` inside a `perspective`-free
  container — boxes become tiles; give each "building" a fake extrusion by
  stacking 2–3 copies offset by (−2,−2)px with darkened strokes.
- **SVG iso**: project by hand — `X = (x−y)·cos30`, `Y = (x+y)·sin30 − z` —
  and draw cuboids as three chalk faces (top bright, left mid, right dark).
- **Exploded architecture**: an isometric stack of layers (LB / servers / DB)
  that separates vertically as narration walks the layers, dashed connectors
  stretching between them. Reverse to "assemble" on the recap.
- **Cutaway / cross-section**: draw the closed box, then a dashed cut line
  sweeps and the front face's opacity drops to reveal the inside machinery.

## True 3D (`@remotion/three`) — the big-moment tool

Setup: `<ThreeCanvas width height camera={{fov:45}}>` (width/height REQUIRED);
HTML siblings composite freely over the GL layer; ANGLE renderer must be set in
`remotion.config.ts`. Never `useFrame` — a `FlyCamera` component sets
`camera.position` + `lookAt` from `useCurrentFrame` every render. Multi-phase
directed cameras: compute each phase's position, blend with smoothstep windows.

Proven set pieces:

- **Globe with data arcs**: dark sphere + wireframe shell + BackSide atmosphere;
  lat/lon → xyz; arcs = lerp two surface vectors, normalize, scale by
  `R·(1+0.34·sin(tπ))`; draw progressively as dotted spheres with a bright
  packet head. THE "global scale" shot.
- **City of services**: seeded grid of emissive-window towers + fog + a
  three-act fly-through (high orbit → street swoop → hero wide).
- **Transparent-alpha 3D over the board**: ThreeCanvas with transparent
  background composited over ChalkBg, 2D Reveals overlaying the GL — 3D as a
  board element, not a scene change.
- Perf: point lights ≤4, `meshBasicMaterial` for glow, `useMemo` all geometry,
  still-check single frames before committing to a full render.

## POV & shot ideas (escalation menu)

Shots that fit the chalk language — use the narration to justify them:

- **First-person hand**: a chalk hand (or just the stroke origin) draws the
  hero shape from the viewer's POV — draw-on with the SFX slightly louder, once.
- **Over-the-shoulder**: Stickman sits at a desk bottom-left foreground
  (larger, 60% opacity silhouette) while the board he watches fills the frame.
- **Inside-the-pipe POV**: the camera IS the request: rings/segment walls
  stream past (parallax circles scaling up), stations (auth, cache, DB) fly by
  as labelled gates. Great for "follow a request through the system".
- **Bird's-eye whiteboard**: top-down view of a desk, coffee-cup and hands as
  props at the edges, the diagram drawing "on paper" — a texture change of pace.
- **Worm's-eye scale shot**: tiny Stickman at bottom looks up at a towering
  bar/stack that keeps growing past the frame top ("the backlog grew…").
- **Dutch angle**: rotate the whole world container 4–7° during instability
  beats; settle to 0° when the fix lands.
- **Spotlight noir**: darkness + a radial-gradient mask spotlight that sweeps
  to find "the bug"; pair with the tension register.
- **Magnifying lens**: a circular mask that magnifies (scale 2× inside the
  circle) and tracks along a line of code/data.
- **Silhouette theater**: black figures on a dim board acting the metaphor,
  then lights up to the real diagram.
- **Match cut**: a shape morphs into the same-topology shape of the next board
  (box → database cylinder) — interpolate between two paths with equal point
  counts.
- **Freeze-frame annotate** (talking-head formats): freeze the host
  mid-gesture, chalk arrows label THEM, resume exactly (see layouts D).
- **Speed ramp**: `playbackRate` changes on the host clip for comedic/emphasis
  timing.
- **Rewind**: run the draw-on progress backwards (p: 1→0) with a tape-rewind
  visual scrub — "let's go back".
- **Timelapse mural**: one continuous long world (4000+px) the camera dollies
  across for the recap, every board's hero prop standing in sequence — the
  "everything we built" shot.
- **Particle assembly**: ~700 seeded particles in lissajous chaos → staggered
  bezier assembly into a word/logo → hold with shimmer → radial burst. State
  machine: chaos/assemble/hold/burst, position = pure fn(seed, frame).
- **Audio-reactive finale**: `useWindowedAudioData` + `visualizeAudio` (log-
  scale the bins!) driving a radial spectrum or bass-pumped title — only where
  music is allowed (speech-free outros).
