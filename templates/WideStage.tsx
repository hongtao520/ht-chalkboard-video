import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { ChalkBg } from "./ChalkBg";
import { Captions } from "./Captions";
import type { CaptionToken } from "./caps";
import { SLATE_DEEP, CHALK, MARK, SEAM, W } from "./theme";

/* ===================================================================
 * Landscape (1920×1080) chalkboard frame: a big rounded "stage" panel on
 * the LEFT that hosts the animation, and a face-cam PiP at BOTTOM-RIGHT.
 *
 * The animation children are authored in their own native coordinate space
 * (srcW × srcH — by default the vertical reel's 1080×SEAM region) and are
 * "contain"-scaled into the stage, so one animation serves both formats.
 *
 * FULL-SCREEN moments: pass `fullWindows` (frame ranges). During those the
 * stage zooms up to fill the whole frame and the face-cam PiP accelerates
 * off to the right and vanishes — then everything returns when the window
 * ends. Use for tables, big diagrams, and any beat that deserves the
 * viewer's full attention.
 * =================================================================== */

export const WIDE_W = 1920;
export const WIDE_H = 1080;

const STAGE = { x: 58, y: 70, w: 1325, h: 956, r: 30 };
const FACE = { x: 1217, y: 396, w: 596, h: 370, r: 26 };
const LINE = "rgba(238,233,220,0.85)";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => x * x * (3 - 2 * x);
const easeIn = Easing.in(Easing.cubic); // accelerate-away for the PiP exit

/** Scale full-frame vertical (1080×1920) content to "contain" inside the
 *  whole wide frame, centred — for full-cover cards while zoomed to full. */
export const FullCover: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scale = Math.min(WIDE_W / 1080, WIDE_H / 1920);
  const dispW = 1080 * scale;
  return (
    <div
      style={{
        position: "absolute",
        left: (WIDE_W - dispW) / 2,
        top: 0,
        width: 1080,
        height: 1920,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};

/** trapezoidal 0→1→0 envelope across [a,b] windows with eased ramps */
const RAMP = 16;
const envelope = (f: number, windows: ReadonlyArray<readonly [number, number]>) => {
  let v = 0;
  for (const [a, b] of windows) {
    if (f < a || f > b) continue;
    const up = interpolate(f, [a, a + RAMP], [0, 1], clamp);
    const down = interpolate(f, [b - RAMP, b], [1, 0], clamp);
    v = Math.max(v, smooth(Math.min(up, down)));
  }
  return v;
};

export const WideStage: React.FC<{
  /** public/ path to the talking-head clip (carries the voice; not muted) */
  faceSrc: string;
  captions: CaptionToken[];
  /** the animation region, authored in srcW × srcH coordinates */
  children: React.ReactNode;
  /** optional full-stage overlay, already wrapped in its own time-gated Sequence */
  overlay?: React.ReactNode;
  /** frame ranges where the stage zooms to full-screen and the PiP exits right */
  fullWindows?: ReadonlyArray<readonly [number, number]>;
  srcW?: number;
  srcH?: number;
}> = ({ faceSrc, captions, children, overlay, fullWindows = [], srcW = W, srcH = SEAM }) => {
  const f = useCurrentFrame();
  const full = envelope(f, fullWindows);

  // ---- normal placement of the region inside the stage ---------------------
  const availW = 1120;
  const availH = STAGE.h - 110;
  const scaleN = Math.min(availW / srcW, availH / srcH);
  const offXn = (availW - srcW * scaleN) / 2 + 12;
  const offYn = 14;

  // ---- full-screen placement (centred in the whole frame, fit height) ------
  const scaleF = (WIDE_H - 60) / srcH;
  const offXf = (WIDE_W - srcW * scaleF) / 2;
  const offYf = (WIDE_H - srcH * scaleF) / 2;

  // ---- interpolate stage box, region transform, PiP ------------------------
  const box = {
    left: lerp(STAGE.x, 0, full),
    top: lerp(STAGE.y, 0, full),
    w: lerp(STAGE.w, WIDE_W, full),
    h: lerp(STAGE.h, WIDE_H, full),
    r: lerp(STAGE.r, 0, full),
  };
  const regScale = lerp(scaleN, scaleF, full);
  const regOffX = lerp(offXn, offXf, full);
  const regOffY = lerp(offYn, offYf, full);

  // face-cam exit: accelerate away (ease-in) + shrink slightly
  const pipExit = easeIn(full);
  const pipX = pipExit * 820;
  const pipScale = 1 - 0.12 * pipExit;
  const pipOp = 1 - smooth(interpolate(full, [0, 0.78], [0, 1], clamp));

  return (
    <AbsoluteFill style={{ background: SLATE_DEEP }}>
      <ChalkBg />

      {/* ---- STAGE (clips the animation; grows to full-screen on cue) ---- */}
      <div
        style={{
          position: "absolute",
          left: box.left,
          top: box.top,
          width: box.w,
          height: box.h,
          borderRadius: box.r,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <ChalkBg />
        <div
          style={{
            position: "absolute",
            left: regOffX,
            top: regOffY,
            width: srcW,
            height: srcH,
            overflow: "hidden",
            transform: `scale(${regScale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
        {overlay}
        {/* captions along the stage bottom — below the face-cam, never collide */}
        <Captions tokens={captions} color={CHALK} markColor={MARK} bottom={28} size={32} />
      </div>

      {/* stage border — fades out as it goes full-screen */}
      <div
        style={{
          position: "absolute",
          left: box.left,
          top: box.top,
          width: box.w,
          height: box.h,
          borderRadius: box.r,
          border: `3px solid ${LINE}`,
          opacity: 1 - full,
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />

      {/* ---- FACE-CAM (slides right + vanishes during full-screen) ---- */}
      <div
        style={{
          position: "absolute",
          left: FACE.x,
          top: FACE.y,
          width: FACE.w,
          height: FACE.h,
          borderRadius: FACE.r,
          border: `3px solid ${LINE}`,
          overflow: "hidden",
          boxSizing: "border-box",
          background: SLATE_DEEP,
          boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
          transform: `translateX(${pipX}px) scale(${pipScale})`,
          transformOrigin: "right bottom",
          opacity: pipOp,
        }}
      >
        <Video src={staticFile(faceSrc)} objectFit="cover" style={{ width: "100%", height: "100%" }} />
      </div>
    </AbsoluteFill>
  );
};
