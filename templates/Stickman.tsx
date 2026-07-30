import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { roughPath, subdivide } from "./wobble";
import { CHALK } from "./theme";

/**
 * One reusable, posable chalk stick figure.
 *
 * Anatomy: real two-bone arms (shoulder→elbow→wrist) and legs (hip→knee→ankle)
 * with hands, feet and an expressive face. Bones are CLEAN straight lines by
 * default (house style: people don't shimmer); pass `wobble` only for a
 * deliberately sketchy figure, which routes every bone through the same chalk
 * "boil" as RoughBox (see ./wobble).
 *
 * Posing is by ANGLE, not absolute coordinates: a pose is a set of joint angles,
 * so poses are reusable across scenes and blendable. For bespoke choreography
 * (e.g. reaching for the board) pass `rightHandTarget` and the right arm
 * is solved with two-bone IK so the elbow bends naturally.
 *
 * Anchor: (x, y) is the HEAD CENTRE; `size` is the full head-to-foot height.
 * All motion is driven by useCurrentFrame (no CSS transitions).
 */

export type StickPose = "idle" | "wave" | "point" | "think" | "shrug" | "walk" | "sit";
export type Expression = "neutral" | "happy" | "curious" | "surprised" | "thinking" | "unsure";

type Limb = { a: number; b: number }; // a = upper-bone angle, b = lower-bone angle relative to upper (deg)
type PoseDef = {
  head: number; // head tilt (deg)
  rArm: Limb;
  lArm: Limb;
  rLeg: Limb;
  lLeg: Limb;
  expr: Expression;
};

// Angle convention: degrees, 0 = straight DOWN, positive = clockwise (toward
// screen-right). "r" limbs are on screen-right, "l" on screen-left.
const POSES: Record<StickPose, PoseDef> = {
  idle: { head: 0, rArm: { a: 18, b: 8 }, lArm: { a: -18, b: -8 }, rLeg: { a: 9, b: -5 }, lLeg: { a: -9, b: 5 }, expr: "neutral" },
  wave: { head: 6, rArm: { a: 150, b: -52 }, lArm: { a: -16, b: -8 }, rLeg: { a: 9, b: -5 }, lLeg: { a: -9, b: 5 }, expr: "happy" },
  point: { head: 8, rArm: { a: 72, b: -10 }, lArm: { a: -20, b: -6 }, rLeg: { a: 12, b: -4 }, lLeg: { a: -7, b: 6 }, expr: "curious" },
  think: { head: -6, rArm: { a: 150, b: -78 }, lArm: { a: -22, b: -10 }, rLeg: { a: 8, b: -5 }, lLeg: { a: -10, b: 4 }, expr: "thinking" },
  shrug: { head: 0, rArm: { a: 58, b: -82 }, lArm: { a: -58, b: 82 }, rLeg: { a: 9, b: -5 }, lLeg: { a: -9, b: 5 }, expr: "unsure" },
  walk: { head: 2, rArm: { a: 22, b: 10 }, lArm: { a: -22, b: -10 }, rLeg: { a: 14, b: -8 }, lLeg: { a: -14, b: 8 }, expr: "happy" },
  // seated & musing: thighs swing forward (≈horizontal), shins drop back to
  // vertical (knees bent ~80°), right hand up at the chin to "think". Pair with
  // a chair drawn under the hips. Face it screen-right with `facing`.
  sit: { head: -5, rArm: { a: 150, b: -80 }, lArm: { a: 46, b: 34 }, rLeg: { a: 80, b: -76 }, lLeg: { a: 66, b: -72 }, expr: "thinking" },
};

type ExprDef = { brow: number; browY: number; mouthCurve: number; open: number; eye: number };
const EXPR: Record<Expression, ExprDef> = {
  neutral: { brow: 0, browY: 0, mouthCurve: 5, open: 0, eye: 1 },
  happy: { brow: -4, browY: -2, mouthCurve: 13, open: 0, eye: 1 },
  curious: { brow: 9, browY: -3, mouthCurve: 2, open: 5, eye: 1.1 },
  surprised: { brow: 2, browY: -7, mouthCurve: 0, open: 14, eye: 1.35 },
  thinking: { brow: 11, browY: 1, mouthCurve: -4, open: 0, eye: 0.9 },
  unsure: { brow: 6, browY: 0, mouthCurve: -6, open: 2, eye: 1 },
};

const D2R = Math.PI / 180;
const clamp01 = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Pt = [number, number];
/** From a point, travel `len` at absolute angle (deg, 0 = down, + = screen-right). */
const reach = (x: number, y: number, len: number, deg: number): Pt => {
  const r = deg * D2R;
  return [x + Math.sin(r) * len, y + Math.cos(r) * len];
};

/** Two-bone IK: solve elbow so the wrist reaches (tx,ty). `bend` picks the elbow side. */
const solveIK = (sx: number, sy: number, tx: number, ty: number, l1: number, l2: number, bend: 1 | -1) => {
  const dx = tx - sx;
  const dy = ty - sy;
  const d = Math.max(Math.abs(l1 - l2) + 1, Math.min(l1 + l2 - 1, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const sh = base + bend * A;
  const ex = sx + Math.cos(sh) * l1;
  const ey = sy + Math.sin(sh) * l1;
  return { elbow: [ex, ey] as Pt, wrist: [sx + Math.cos(base) * d, sy + Math.sin(base) * d] as Pt };
};

const lerpLimb = (a: Limb, b: Limb, t: number): Limb => ({ a: a.a + (b.a - a.a) * t, b: a.b + (b.b - a.b) * t });
const lerpPose = (from: PoseDef, to: PoseDef, t: number): PoseDef => ({
  head: from.head + (to.head - from.head) * t,
  rArm: lerpLimb(from.rArm, to.rArm, t),
  lArm: lerpLimb(from.lArm, to.lArm, t),
  rLeg: lerpLimb(from.rLeg, to.rLeg, t),
  lLeg: lerpLimb(from.lLeg, to.lLeg, t),
  expr: t < 0.5 ? from.expr : to.expr,
});

export type StickmanProps = {
  /** head-centre anchor */
  x: number;
  y: number;
  /** full head-to-foot height in px */
  size: number;
  pose?: StickPose;
  /** blend from this pose into `pose` over `blend` (0..1) — for smooth transitions */
  blendFrom?: StickPose;
  blend?: number;
  /** override the pose's default face */
  expression?: Expression;
  /** eyes/head look direction, -1 (left) .. 1 (right) */
  facing?: number;
  /** mouth flap for talking windows */
  talking?: boolean;
  /** ambient breathing sway + blink */
  idle?: boolean;
  color?: string;
  sw?: number;
  /** chalk variation */
  seed?: number;
  /** absolute frame the figure starts drawing on */
  delay?: number;
  /** IK override for the right hand (absolute px) — for bespoke choreography */
  rightHandTarget?: { x: number; y: number } | null;
  /** IK override for the left hand (absolute px) */
  leftHandTarget?: { x: number; y: number } | null;
  /** chalk "boil" jitter — OFF by default (house style: people are clean lines); opt in only for deliberately sketchy figures */
  wobble?: boolean;
  /** classic plain stick figure: no face, no hand knobs, limbs join the body centerline */
  simple?: boolean;
};

export const Stickman: React.FC<StickmanProps> = ({
  x,
  y,
  size,
  pose = "idle",
  blendFrom,
  blend = 1,
  expression,
  facing = 0,
  talking = false,
  idle = true,
  color = CHALK,
  sw = 5,
  seed = 1,
  delay = 0,
  rightHandTarget = null,
  leftHandTarget = null,
  wobble = false,
  simple = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // ---- resolve pose (with optional blend) ---------------------------------
  let P = POSES[pose];
  if (blendFrom && blend < 1) P = lerpPose(POSES[blendFrom], POSES[pose], Math.max(0, Math.min(1, blend)));

  // ---- walk overrides: swing legs + counter-swing arms --------------------
  if (pose === "walk") {
    const ph = Math.sin(frame * 0.45);
    P = { ...P, rLeg: { a: 11 * ph, b: -8 - 6 * Math.max(0, -ph) }, lLeg: { a: -11 * ph, b: -8 - 6 * Math.max(0, ph) }, rArm: { a: 16 - 14 * ph, b: 14 }, lArm: { a: -16 + 14 * ph, b: -14 } };
  }

  const expr = EXPR[expression ?? P.expr];

  // ---- proportions (fractions of full height) -----------------------------
  const H = size;
  const f = (v: number) => v * H;
  const headR = f(0.105);
  const shoulderY = y + headR + f(0.05);
  const hipY = shoulderY + f(0.34);
  const upArm = f(0.16);
  const foreArm = f(0.15);
  const handR = f(0.022);
  const thigh = f(0.21);
  const shin = f(0.2);
  const footLen = f(0.06);
  const shOff = simple ? 0 : f(0.022);
  const hipOff = simple ? 0 : f(0.026);

  const rSh: Pt = [x + shOff, shoulderY];
  const lSh: Pt = [x - shOff, shoulderY];
  const rHip: Pt = [x + hipOff, hipY];
  const lHip: Pt = [x - hipOff, hipY];

  // ---- arms (IK target overrides angle pose) ------------------------------
  const arm = (sh: Pt, limb: Limb, target: { x: number; y: number } | null, bend: 1 | -1) => {
    if (target) {
      const { elbow, wrist } = solveIK(sh[0], sh[1], target.x, target.y, upArm, foreArm, bend);
      return { elbow, wrist };
    }
    const elbow = reach(sh[0], sh[1], upArm, limb.a);
    const wrist = reach(elbow[0], elbow[1], foreArm, limb.a + limb.b);
    return { elbow, wrist };
  };
  const rA = arm(rSh, P.rArm, rightHandTarget, 1);
  const lA = arm(lSh, P.lArm, leftHandTarget, -1);

  // ---- legs ----------------------------------------------------------------
  const rKnee = reach(rHip[0], rHip[1], thigh, P.rLeg.a);
  const rAnkle = reach(rKnee[0], rKnee[1], shin, P.rLeg.a + P.rLeg.b);
  const lKnee = reach(lHip[0], lHip[1], thigh, P.lLeg.a);
  const lAnkle = reach(lKnee[0], lKnee[1], shin, P.lLeg.a + P.lLeg.b);

  // ---- ambient life --------------------------------------------------------
  const swayDeg = idle ? Math.sin(t * 2 * Math.PI * 0.11) * 1.3 : 0;
  const bob = idle ? Math.sin(t * 2 * Math.PI * 0.25) * f(0.004) : 0;
  const walkBob = pose === "walk" ? Math.abs(Math.sin(frame * 0.45)) * -f(0.02) : 0;

  // blink ~every 3.2s
  const sinceBlink = frame % Math.round(fps * 3.2);
  const blink = idle ? interpolate(sinceBlink, [0, 3, 6], [0, 1, 0], clamp01) : 0;
  const eyeOpen = expr.eye * (1 - blink);

  // mouth flap while talking (scaled by head size, not figure height)
  const mouthOpen = talking
    ? (Math.sin(frame * 0.9) + Math.sin(frame * 1.7 + 1) > 0.4 ? headR * 0.42 : headR * 0.12)
    : headR * (expr.open / 50);
  const mouthOpenMin = headR * 0.06;

  // ---- draw-on progress (staggered build) ---------------------------------
  const draw = (d: number) => interpolate(frame, [delay + d, delay + d + 16], [0, 1], clamp01);
  const dash = (p: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p } as const);
  const faceP = draw(20);

  const line = { fill: "none" as const, stroke: color, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  const bone = (a: Pt, b: Pt, sd: number, p: number) =>
    wobble ? (
      <path d={roughPath(subdivide(a, b, 3), sd, frame, 1, false)} {...line} {...dash(p)} />
    ) : (
      <path d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`} {...line} {...dash(p)} />
    );

  // head circle as a rough closed loop
  const headPts: Pt[] = [];
  for (let i = 0; i <= 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    headPts.push([x + Math.cos(a) * headR, y + Math.sin(a) * headR]);
  }

  // face geometry (relative to head centre)
  const look = facing * headR * 0.28;
  const eyeY = y - headR * 0.12;
  const eyeDX = headR * 0.4;
  const eyeR = headR * 0.1;
  const browY = eyeY - headR * 0.32 + expr.browY;
  const mouthY = y + headR * 0.42;
  const mouthW = headR * 0.42;

  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`rotate(${swayDeg} ${x} ${hipY}) translate(0 ${bob + walkBob})`}>
        {/* head */}
        {wobble ? (
          <path d={roughPath(headPts, seed, frame, 1, true)} {...line} {...dash(draw(0))} />
        ) : (
          <circle cx={x} cy={y} r={headR} {...line} {...dash(draw(0))} />
        )}

        {/* neck + spine */}
        {bone([x, y + headR * 0.95], [x, shoulderY], seed + 1, draw(2))}
        {bone([x, shoulderY], [x, hipY], seed + 2, draw(2))}

        {/* arms */}
        {bone(rSh, rA.elbow, seed + 3, draw(6))}
        {bone(rA.elbow, rA.wrist, seed + 4, draw(8))}
        {bone(lSh, lA.elbow, seed + 5, draw(6))}
        {bone(lA.elbow, lA.wrist, seed + 6, draw(8))}
        {!simple ? (
          <>
            <circle cx={rA.wrist[0]} cy={rA.wrist[1]} r={handR} fill={color} opacity={draw(9)} />
            <circle cx={lA.wrist[0]} cy={lA.wrist[1]} r={handR} fill={color} opacity={draw(9)} />
          </>
        ) : null}

        {/* legs */}
        {bone(rHip, rKnee, seed + 7, draw(10))}
        {bone(rKnee, rAnkle, seed + 8, draw(12))}
        {bone(lHip, lKnee, seed + 9, draw(10))}
        {bone(lKnee, lAnkle, seed + 10, draw(12))}
        {/* feet */}
        {bone(rAnkle, [rAnkle[0] + footLen, rAnkle[1]], seed + 11, draw(13))}
        {bone(lAnkle, [lAnkle[0] - footLen, lAnkle[1]], seed + 12, draw(13))}

        {/* ---- face (fades in after the head draws) ---- */}
        {!simple ? (
        <g opacity={faceP}>
          {/* eyes */}
          <g transform={`translate(${look} 0)`}>
            <ellipse cx={x - eyeDX} cy={eyeY} rx={eyeR} ry={eyeR * eyeOpen} fill={color} />
            <ellipse cx={x + eyeDX} cy={eyeY} rx={eyeR} ry={eyeR * eyeOpen} fill={color} />
          </g>
          {/* brows (expr.brow tilts the inner ends) */}
          <path d={`M ${x - eyeDX - eyeR} ${browY + expr.brow * 0.4} L ${x - eyeDX + eyeR} ${browY - expr.brow * 0.4}`} {...line} strokeWidth={sw * 0.7} />
          <path d={`M ${x + eyeDX - eyeR} ${browY - expr.brow * 0.4} L ${x + eyeDX + eyeR} ${browY + expr.brow * 0.4}`} {...line} strokeWidth={sw * 0.7} />
          {/* mouth: open ellipse when talking/surprised, else a curved line */}
          {mouthOpen > mouthOpenMin ? (
            <ellipse cx={x} cy={mouthY} rx={mouthW * 0.7} ry={mouthOpen} fill="none" stroke={color} strokeWidth={sw * 0.7} />
          ) : (
            <path d={`M ${x - mouthW} ${mouthY} Q ${x} ${mouthY + expr.mouthCurve} ${x + mouthW} ${mouthY}`} {...line} strokeWidth={sw * 0.7} />
          )}
        </g>
        ) : null}
      </g>
    </svg>
  );
};
