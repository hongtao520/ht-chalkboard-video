import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
export type KWord = { t: string; s: number; e: number };
export type KChunk = { s: number; e: number; words: KWord[] };

const { fontFamily: FF } = loadMontserrat("normal", { weights: ["700", "800"], subsets: ["latin"] });

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

type Props = {
  chunks: KChunk[];
  color?: string;
  activeColor?: string;
  bottom?: number;
  size?: number;
  /** show the chunk this many ms before its first word is spoken */
  lead?: number;
};

/**
 * Karaoke-style captions: shows only the current ≤6-word chunk and highlights
 * the exact word being spoken (a "word tracker"), driven by real per-word
 * timings. Text + timing come straight from the transcript, so it stays exactly
 * in sync with the audio.
 */
export const KaraokeCaptions: React.FC<Props> = ({ chunks, color = "#EEE9DC", activeColor = "#F2D06B", bottom = 470, size = 54, lead = 160 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;

  // active chunk = the last one whose lead-in has started
  let ci = -1;
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].s - lead <= t) ci = i;
  }
  if (ci < 0) return null;
  const chunk = chunks[ci];
  const nextS = ci + 1 < chunks.length ? chunks[ci + 1].s : null;

  // hide once the final chunk is well past
  if (nextS == null && t > chunk.e + 700) return null;

  // fade in on entry, and out just before the next chunk takes over
  const appearIn = clamp((t - (chunk.s - lead)) / 180);
  const fadeOut = nextS != null ? clamp((nextS - 110 - t) / 130) : 1;
  const opacity = Math.min(appearIn, fadeOut);

  // active word = last word already started
  let wi = -1;
  for (let i = 0; i < chunk.words.length; i++) {
    if (chunk.words[i].s <= t) wi = i;
  }

  return (
    <div style={{ position: "absolute", left: 40, right: 40, bottom, textAlign: "center", opacity }}>
      <div
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "6px 12px",
          maxWidth: 940,
          padding: "14px 26px",
          borderRadius: 20,
          background: "rgba(10,12,13,0.78)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        }}
      >
        {chunk.words.map((w, i) => {
          const active = i === wi;
          const spoken = i < wi;
          // a quick scale pop as each word lands, decaying over ~110ms
          const pop = active ? 1 + 0.16 * Math.exp(-Math.max(0, t - w.s) / 110) : 1;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontFamily: FF,
                fontWeight: 800,
                fontSize: size,
                lineHeight: 1.18,
                letterSpacing: 0.3,
                color: active ? "#1b1400" : color,
                opacity: active ? 1 : spoken ? 0.92 : 0.45,
                background: active ? activeColor : "transparent",
                borderRadius: 10,
                padding: active ? "2px 12px" : "2px 2px",
                transform: `scale(${pop})`,
                transformOrigin: "center bottom",
                textShadow: active ? "none" : "0 2px 10px rgba(0,0,0,0.85)",
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </div>
  );
};
