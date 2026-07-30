import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { liveWobble, roughPath, wobble } from "./wobble";

const drawProgress = (frame: number, delay: number, duration = 20) =>
  interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

type RoughBoxProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  stroke: string;
  strokeWidth?: number;
  roughness?: number;
  seed?: number;
  delay?: number;
  /** draw-on length in frames */
  duration?: number;
  fill?: string;
};

export const RoughBox: React.FC<RoughBoxProps> = ({
  x,
  y,
  w,
  h,
  stroke,
  strokeWidth = 3,
  roughness = 1.4,
  seed = 1,
  delay = 0,
  duration = 20,
  fill = "none",
}) => {
  const frame = useCurrentFrame();
  const p = drawProgress(frame, delay, duration);
  const pts = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
    [x, y],
  ];
  const path = pts
    .map(([px, py], i) => {
      const wx = liveWobble(seed, i, frame) * roughness;
      const wy = liveWobble(seed + 7, i, frame) * roughness;
      return `${i === 0 ? "M" : "L"} ${px + wx} ${py + wy}`;
    })
    .join(" ");

  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <path d={path} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    </svg>
  );
};

type RoughArrowProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth?: number;
  seed?: number;
  delay?: number;
  /** draw-on length in frames */
  duration?: number;
  curve?: number;
  /** when true, a dot travels along the arrow (data flowing) after it's drawn */
  pulse?: boolean;
  pulseColor?: string;
};

export const RoughArrow: React.FC<RoughArrowProps> = ({ x1, y1, x2, y2, stroke, strokeWidth = 3, seed = 1, delay = 0, duration = 16, curve = 0, pulse = false, pulseColor }) => {
  const frame = useCurrentFrame();
  const p = drawProgress(frame, delay, duration);
  const mx = (x1 + x2) / 2 + curve;
  const my = (y1 + y2) / 2;
  const wx = wobble(seed, 0);
  const wy = wobble(seed, 1);
  const px0 = x1 + wx;
  const py0 = y1 + wy;
  const path = `M ${px0} ${py0} Q ${mx} ${my} ${x2} ${y2}`;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 14;
  const hx = x2 - headLen * Math.cos(angle - 0.4);
  const hy = y2 - headLen * Math.sin(angle - 0.4);
  const hx2 = x2 - headLen * Math.cos(angle + 0.4);
  const hy2 = y2 - headLen * Math.sin(angle + 0.4);

  // looping pulse along the quadratic bezier, after the arrow has drawn
  const period = 26;
  const pulseStart = delay + duration + 2;
  const tp = ((frame - pulseStart) % period) / period;
  const showPulse = pulse && frame >= pulseStart && tp >= 0;
  const bx = (1 - tp) * (1 - tp) * px0 + 2 * (1 - tp) * tp * mx + tp * tp * x2;
  const by = (1 - tp) * (1 - tp) * py0 + 2 * (1 - tp) * tp * my + tp * tp * y2;
  const pulseFade = Math.sin(tp * Math.PI); // fade in/out at the ends

  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      {p > 0.85 ? (
        <path d={`M ${x2} ${y2} L ${hx} ${hy} M ${x2} ${y2} L ${hx2} ${hy2}`} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
      ) : null}
      {showPulse ? <circle cx={bx} cy={by} r={6} fill={pulseColor ?? stroke} opacity={pulseFade} /> : null}
    </svg>
  );
};

type RoughEllipseProps = {
  cx: number;
  cy: number;
  w: number;
  h: number;
  stroke: string;
  strokeWidth?: number;
  roughness?: number;
  seed?: number;
  delay?: number;
};

export const RoughEllipse: React.FC<RoughEllipseProps> = ({ cx, cy, w, h, stroke, strokeWidth = 3, roughness = 1.2, seed = 1, delay = 0 }) => {
  const frame = useCurrentFrame();
  const p = drawProgress(frame, delay);
  const rx = w / 2;
  const ry = h / 2;
  const segments = 24;
  const pts: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const px = cx + Math.cos(t) * rx + liveWobble(seed, i, frame) * roughness;
    const py = cy + Math.sin(t) * ry + liveWobble(seed + 3, i, frame) * roughness;
    pts.push(`${i === 0 ? "M" : "L"} ${px} ${py}`);
  }
  const path = pts.join(" ");

  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    </svg>
  );
};

type RoughCircleProps = {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke?: string;
  delay?: number;
};

export const RoughCircle: React.FC<RoughCircleProps> = ({ cx, cy, r, fill, stroke, delay = 0 }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <circle cx={cx} cy={cy} r={r * scale} fill={fill} stroke={stroke ?? fill} strokeWidth={2} />
    </svg>
  );
};

type RoughStrokeProps = {
  /** polyline points; pass ≥3 (subdivide a straight line) so the middle bows */
  points: ReadonlyArray<readonly [number, number]>;
  stroke: string;
  strokeWidth?: number;
  roughness?: number;
  seed?: number;
  delay?: number;
  duration?: number;
  close?: boolean;
  opacity?: number;
};

/** A free-form hand-drawn polyline that "draws on". Building block for sketch rigs. */
export const RoughStroke: React.FC<RoughStrokeProps> = ({ points, stroke, strokeWidth = 4, roughness = 1, seed = 1, delay = 0, duration = 20, close = false, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const p = drawProgress(frame, delay, duration);
  const d = roughPath(points, seed, frame, roughness, close);
  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} opacity={opacity} />
    </svg>
  );
};
