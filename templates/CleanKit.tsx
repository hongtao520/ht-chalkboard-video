import React from "react";
import { interpolate, Sequence, useCurrentFrame } from "remotion";
import { loadFont as loadKalam } from "@remotion/google-fonts/Kalam";
import { useReveal } from "./anim";
import { CHALK, MONO, W, FPS } from "./theme";

const { fontFamily: KALAM } = loadKalam("normal", { weights: ["400", "700"], subsets: ["latin"] });
/** The board handwriting face — for bespoke elements (stamps, labels) outside Reveal. */
export { KALAM };

/* ===================================================================
 * The "Clean Kit" — ruler-straight SVG that draws on (NO chalk boil).
 * House rule: organic things (people, clouds, planets) and precise things
 * (charts, tables) use this kit; boxes/arrows MAY use the Rough kit instead.
 *
 * Every board file typically copies/imports this kit and composes boards
 * from: Line, Reveal, Head, Dot, Board (+ Rough kit + Stickman as needed).
 * =================================================================== */

export const sec = (s: number) => Math.round(s * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ip = (f: number, i: number[], o: number[]) => interpolate(f, i, o, clamp);

export const SVG = { position: "absolute" as const, inset: 0, overflow: "visible" as const, pointerEvents: "none" as const };
const stroked = { fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const polyD = (pts: ReadonlyArray<readonly [number, number]>, close = false) =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ") + (close ? " Z" : "");

export const useDraw = (delay: number, dur = 16) => ip(useCurrentFrame(), [delay, delay + dur], [0, 1]);

/** A clean polyline that draws on over `dur` frames after `delay`. */
export const Line: React.FC<{
  points: ReadonlyArray<readonly [number, number]>;
  stroke?: string;
  sw?: number;
  delay?: number;
  dur?: number;
  close?: boolean;
  opacity?: number;
  dashed?: boolean;
}> = ({ points, stroke = CHALK, sw = 4, delay = 0, dur = 20, close = false, opacity = 1, dashed = false }) => {
  const p = useDraw(delay, dur);
  return (
    <svg style={SVG}>
      <path
        d={polyD(points, close)}
        stroke={stroke}
        strokeWidth={sw}
        opacity={opacity}
        strokeDasharray={dashed ? "3 10" : 1}
        strokeDashoffset={dashed ? 0 : 1 - p}
        pathLength={1}
        {...stroked}
      />
    </svg>
  );
};

/** Text that fades + spring-rises in ("reveal pop"). Kalam by default, MONO for numbers. */
export const Reveal: React.FC<{
  left: number;
  top: number;
  width: number;
  delay: number;
  size?: number;
  color?: string;
  align?: "left" | "center" | "right";
  weight?: number;
  mono?: boolean;
  children: React.ReactNode;
}> = ({ left, top, width, delay, size = 40, color = CHALK, align = "center", weight = 700, mono = false, children }) => {
  const { opacity, dy } = useReveal(delay);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        textAlign: align,
        fontFamily: mono ? MONO : KALAM,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.16,
        color,
        opacity,
        transform: `translateY(${dy}px)`,
      }}
    >
      {children}
    </div>
  );
};

/** The board headline, top of the graphics region. */
export const Head: React.FC<{ delay?: number; color?: string; top?: number; children: React.ReactNode }> = ({
  delay = 0,
  color = CHALK,
  top = 140,
  children,
}) => (
  <Reveal left={70} top={top} width={W - 140} delay={delay} size={62} color={color} weight={700}>
    {children}
  </Reveal>
);

/** A dot that scales in. */
export const Dot: React.FC<{ cx: number; cy: number; r: number; fill: string; delay?: number }> = ({ cx, cy, r, fill, delay = 0 }) => {
  const s = ip(useCurrentFrame(), [delay, delay + 6], [0, 1]);
  return (
    <svg style={SVG}>
      <circle cx={cx} cy={cy} r={r * s} fill={fill} />
    </svg>
  );
};

/** Fades children in/out over the window edges. */
export const Fade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const op = ip(f, [0, 12, dur - 12, dur], [0, 1, 1, 0]);
  return <div style={{ position: "absolute", inset: 0, opacity: op }}>{children}</div>;
};

/**
 * One "board" = one beat of the voiceover. Give it an absolute frame window;
 * it sequences + cross-fades. A video is a stack of Boards timed to speech.
 */
export const Board: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => (
  <Sequence from={from} durationInFrames={to - from} layout="none">
    <Fade dur={to - from}>{children}</Fade>
  </Sequence>
);
