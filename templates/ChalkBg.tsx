import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SLATE } from "./theme";

/** A soft, diffuse light patch — reads as uneven chalkboard wear, not a ring. */
const Cloud: React.FC<{ left: number; top: number; w: number; h: number; op: number }> = ({ left, top, w, h, op }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width: w,
      height: h,
      borderRadius: "50%",
      background: `radial-gradient(closest-side, rgba(238,233,220,${op}), rgba(238,233,220,0) 72%)`,
      filter: "blur(40px)",
    }}
  />
);

/**
 * Shared chalkboard background: slate gradient + faint erased smudges +
 * animated film grain + vignette. Render as the first child of a scene.
 */
export const ChalkBg: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: SLATE }}>
      <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 28%, #2C3637 0%, ${SLATE} 68%)` }} />

      {/* uneven board wear — soft diffuse light patches (no rings) */}
      <Cloud left={-120} top={260} w={620} h={420} op={0.035} />
      <Cloud left={640} top={980} w={720} h={520} op={0.03} />
      <Cloud left={120} top={1380} w={560} h={380} op={0.025} />

      {/* animated grain */}
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id="chalk-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 73} stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#chalk-grain)" />
        </svg>
      </AbsoluteFill>

      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(130% 95% at 50% 42%, transparent 52%, rgba(0,0,0,0.5) 100%)" }} />
    </AbsoluteFill>
  );
};
