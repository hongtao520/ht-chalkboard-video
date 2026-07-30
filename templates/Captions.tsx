import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import type { CaptionToken } from "./caps";

// One bold, highly legible caption face for every video. Loaded here so the
// whole project gets the same upgraded subtitles from a single place.
const { fontFamily: CAPTION_FF } = loadMontserrat("normal", { weights: ["700", "800"], subsets: ["latin"] });

type CaptionsProps = {
  tokens: CaptionToken[];
  color: string;
  markColor: string;
  /** kept for backwards-compat; the component now uses its own caption font */
  fontFamily?: string;
  /** distance from the bottom of the parent region, px */
  bottom?: number;
  size?: number;
};

const FADE = 8;
/** Never render captions smaller than this — keeps them readable on phones. */
const MIN_SIZE = 44;

/**
 * Renders the caption active at the current frame near the bottom of its parent.
 *
 * High-visibility styling: a bold Montserrat face on a dark rounded "pill" with
 * a soft drop shadow, so text stays readable over busy chalk art or full-screen
 * cards. Highlighted segments get a stronger `markColor` chip.
 *
 * NOTE on placement: when this sits over a FULL-screen parent, pass a larger
 * `bottom` (~460) so captions clear the bottom action bar / dead zone on X,
 * TikTok, Reels, etc. The default (70) suits the split-screen graphics region,
 * which lands around the vertical middle of the frame.
 */
export const Captions: React.FC<CaptionsProps> = ({ tokens, color, markColor, bottom = 70, size = 46 }) => {
  const frame = useCurrentFrame();
  const active = tokens.find((t) => frame >= t.fromFrame - FADE && frame <= t.toFrame + FADE);
  if (!active) return null;

  // Per-caption placement override ("self-adjusting" subtitles) — lets a single
  // caption dodge the face / a diagram and shrink to fit a tight gap.
  const place = active.place;
  const fontSize = place?.size ?? Math.max(size, MIN_SIZE);
  const anchorTop = place?.top != null;
  const verticalStyle = anchorTop ? { top: place!.top } : { bottom: place?.bottom ?? bottom };

  const opacity = interpolate(
    frame,
    [active.fromFrame - FADE, active.fromFrame, active.toFrame, active.toFrame + FADE],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        ...verticalStyle,
        textAlign: "center",
        opacity,
      }}
    >
      <span
        style={{
          display: "inline",
          fontFamily: CAPTION_FF,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.5,
          letterSpacing: 0.3,
          color,
          background: "rgba(10,12,13,0.74)",
          padding: "8px 22px",
          borderRadius: 16,
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
          textShadow: "0 2px 10px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)",
        }}
      >
        {active.segs.map((seg, i) =>
          seg.mark ? (
            <span
              key={i}
              style={{
                background: markColor,
                color: "#FFF4D6",
                borderRadius: 8,
                padding: "0 8px",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }}
            >
              {seg.text}
            </span>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </span>
    </div>
  );
};
