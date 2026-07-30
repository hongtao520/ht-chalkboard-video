import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const useReveal = (delay: number, frame?: number) => {
  const globalFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame ?? globalFrame;
  const opacity = interpolate(f, [delay, delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  // spring drives the rise with a gentle overshoot ("pop")
  const s = spring({ frame: f - delay, fps, config: { damping: 14, mass: 0.7, stiffness: 130 } });
  const dy = interpolate(s, [0, 1], [18, 0]);
  return { opacity, dy };
};

/**
 * Counter roll-up (L5 kinetic typography): a number that climbs from `from`
 * to `to` over `dur` frames after `delay`, easing out so the last digits
 * settle. Format the result yourself (Math.round / toLocaleString / units).
 */
export const useCountUp = (delay: number, dur: number, to: number, from = 0) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [delay, delay + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return from + (to - from) * t;
};

/**
 * Impact shake (L4 virtual camera): decaying incommensurate sines kicked off
 * at frame `at`. Spread the returned {x, y, rot} onto a container transform.
 */
export const useImpactShake = (at: number, amp = 9, dur = 20) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return { x: 0, y: 0, rot: 0 };
  const t = (f - at) / dur;
  const decay = (1 - t) * (1 - t);
  const p = f - at;
  return {
    x: amp * decay * Math.sin(p * 2.3),
    y: amp * 0.7 * decay * Math.cos(p * 3.1),
    rot: amp * 0.06 * decay * Math.sin(p * 2.7),
  };
};

export const useFadeOut = (start: number, duration = 10) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [start, start + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const useSceneOpacity = (start: number, end: number, fade = 12) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [start, start + fade], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outP = interpolate(frame, [end - fade, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.min(inP, outP);
};
