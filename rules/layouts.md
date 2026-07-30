# Layouts — the format playbook

Pick the layout from the raw material + target platform, then keep its
geometry rules absolute.

## A · Vertical full-board reel (1080×1920) — audio-only clips

The whole frame is chalkboard; the voice plays as `<Audio>`; no host on screen.

- Headline `top: 140`, hero zone ≈ y 300–1000, secondary annotations 1000–1300.
- **Caption band ≈ y 1300–1500** (`bottom: 470` with karaoke captions) — clears
  the platform dead zone (bottom ~420px on X/TikTok/Reels where UI overlays sit).
  NOTHING critical below y≈1500.
- Best for: audio rips, fast concept reels. This is the format of the
  best-subtitle examples (see `examples/case-studies.md`).

## B · Vertical split-with-host (1080×1920) — talking-head clips

- Graphics region: top `SEAM = round(H·0.56)` = 1075px of chalkboard.
- Host video: bottom `H − SEAM`, `objectFit: cover`, centered.
- Captions live INSIDE the graphics region near its bottom (`bottom: 70` of the
  region) — around the vertical middle of the full frame, above the host's head.
- The graphics region is the source of truth: author boards in 1080×SEAM
  coordinates so the same boards can be re-staged into landscape (below).
- Scene-per-clip: one component per re-edited host clip, glued with `<Series>`,
  each trimmed to just after its last word — speech flows across hard cuts
  (hard cuts are fine when the talking head is continuous).

## C · Landscape stage + face-cam PiP (1920×1080) — YouTube

`templates/WideStage.tsx`:

- Chalkboard fills the frame; a rounded **stage panel** left (~1325×956) holds
  the animation; **face-cam PiP** bottom-right (~596×370, chalk border, shadow).
- The animation children are authored in their native region coordinates
  (default 1080×SEAM) and contain-scaled into the stage → one animation source
  serves vertical AND landscape.
- **`fullWindows`** (frame ranges): the stage zooms to fill the frame while the
  PiP *accelerates* off right (ease-in — it exits like an object with mass,
  not a fade). Use for tables, wide diagrams, cinematic beats. Trapezoid
  envelope with 16-frame eased ramps; everything returns after the window.
- `FullCover` contain-scales a full vertical card into the wide frame for
  full-attention moments (mission cards, titles).
- Captions along the stage bottom (size ~32), never under the PiP.

## D · Full-screen host with annotation (footage compositing)

The host clip itself is a layer to direct:

- Full-bleed host with a chalk frame; **freeze mid-gesture** and annotate THEM
  with chalk arrows/circles: `<Sequence 0..P>` plays video; `<Sequence P..Q>`
  wraps `<Freeze frame={0}><Video trimBefore={P} muted/></Freeze>`;
  `<Sequence Q..>` plays `<Video trimBefore={P}/>` — audio resumes exactly
  where it froze.
- Grade washes: ramp a CSS `filter: grayscale() sepia() hue-rotate()` chain.
- PiP path: keyframe the wrapper's transform. ⚠️ in
  `transform: translate(...) scale(...)` the translate is in FINAL pixels
  (applied after scale) — compute corner landings before picking values.

## Shared geometry rules

- 70px minimum side margins for text at 1080 wide (scale proportionally).
- The hero visual owns the optical centre; headline top; captions bottom band.
- Persistent props keep their position across boards.
- When staging one source into another (region → stage), scale the CONTAINER —
  never re-lay-out the content per format.
