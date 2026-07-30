import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { ChalkBg } from "./ChalkBg";
import { Board, Head, KALAM, Line, Reveal, ip, sec } from "./CleanKit";
import { RoughArrow, RoughBox } from "./Rough";
import { Stickman } from "./Stickman";
import { Sfx } from "./Sfx";
import { KaraokeCaptions, type KChunk } from "./KaraokeCaptions";
import { useCountUp, useImpactShake } from "./anim";
import { C, CHALK, DUST, MONO, SLATE_DEEP, W } from "./theme";

/* ===================================================================
 * A complete minimal chalkboard video — the starter skeleton.
 * Format A (vertical 1080×1920 full-board reel over an audio clip).
 *
 * Register in src/Root.tsx:
 *
 *   <Composition id="example" component={ExampleVideo} fps={FPS}
 *     width={1080} height={1920} durationInFrames={EXAMPLE_DURATION} />
 *
 * Before rendering:
 *   1. put the raw clip at public/raw/clip.mov
 *   2. node scripts/transcribe.mjs public/raw/clip.mov
 *   3. node scripts/build-words.mjs public/raw/clip.captions.json src/data/clipWords.ts CHUNKS
 *   4. node scripts/synth.mjs sfx     (generates public/sfx/gen/)
 * then replace SAMPLE_CHUNKS with the generated CHUNKS import and set the
 * board windows from the real word timestamps.
 * =================================================================== */

export const EXAMPLE_DURATION = sec(18);

// Placeholder — replace with `import { CHUNKS } from "../data/clipWords"`.
const SAMPLE_CHUNKS: KChunk[] = [
  {
    s: 300,
    e: 2100,
    words: [
      { t: "Every", s: 300, e: 700 },
      { t: "request", s: 700, e: 1200 },
      { t: "hits", s: 1200, e: 1500 },
      { t: "one", s: 1500, e: 1800 },
      { t: "server.", s: 1800, e: 2100 },
    ],
  },
  {
    s: 2400,
    e: 4800,
    words: [
      { t: "Until", s: 2400, e: 2800 },
      { t: "the", s: 2800, e: 3000 },
      { t: "traffic", s: 3000, e: 3600 },
      { t: "grows…", s: 3600, e: 4800 },
    ],
  },
];

/* ---- board 1: the setup — a server, a user, a request flowing ---------- */
const B1Setup: React.FC = () => (
  <>
    <Head delay={0}>One server</Head>
    {/* the user */}
    <Stickman x={200} y={560} size={240} pose="point" facing={1} delay={sec(0.3)} idle />
    {/* the server (rough box = diagram vocabulary) */}
    <RoughBox x={600} y={480} w={300} h={220} stroke={C.amber} strokeWidth={4} delay={sec(0.8)} seed={2} />
    <Reveal left={600} top={560} width={300} delay={sec(1.1)} size={38} color={DUST}>
      server
    </Reveal>
    {/* the request travels — pulse dot loops after the arrow draws */}
    <RoughArrow x1={330} y1={580} x2={580} y2={580} stroke={CHALK} strokeWidth={4} delay={sec(1.6)} pulse pulseColor={C.blue} />
    <Reveal left={70} top={900} width={W - 140} delay={sec(2.6)} size={42} color={CHALK}>
      every <span style={{ color: C.blue }}>request</span> → one machine
    </Reveal>
  </>
);

/* ---- board 2: the problem — load climbs, the box shakes, it crashes ---- */
const B2Crash: React.FC = () => {
  const f = useCurrentFrame();
  const load = Math.round(useCountUp(sec(0.5), sec(4), 12000, 100));
  const hot = ip(f, [sec(3), sec(5)], [0, 1]); // danger ramps in
  const shake = useImpactShake(sec(5.2), 10, 22);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rot}deg)` }}>
      <Head delay={0} color={C.coral}>
        Traffic grows
      </Head>
      <RoughBox x={390} y={480} w={300} h={220} stroke={C.amber} strokeWidth={4} delay={0} seed={2} />
      {/* live counter — numbers are characters (mono, roll-up, settle) */}
      <Reveal left={70} top={330} width={W - 140} delay={sec(0.5)} size={76} color={C.coral} mono>
        {`${load.toLocaleString()} req/s`}
      </Reveal>
      {/* danger creeps in: dashed coral outline grows around the server */}
      <Line
        points={[
          [370, 460],
          [710, 460],
          [710, 720],
          [370, 720],
        ]}
        close
        dashed
        stroke={C.coral}
        sw={3}
        delay={sec(3)}
        opacity={hot}
      />
      <Reveal left={70} top={900} width={W - 140} delay={sec(5.4)} size={44} color={C.coral}>
        …and one machine <span style={{ fontFamily: MONO }}>dies</span>
      </Reveal>
    </div>
  );
};

/* ---- board 3: the payoff — the fix lands with a stamp ------------------ */
const B3Fix: React.FC = () => {
  const f = useCurrentFrame();
  const stamp = ip(f, [sec(2), sec(2.4)], [1.6, 1]);
  const stampOp = ip(f, [sec(2), sec(2.4)], [0, 1]);
  return (
    <>
      <Head delay={0} color={C.green}>
        Add more servers
      </Head>
      {[0, 1, 2].map((i) => (
        <RoughBox key={i} x={180 + i * 260} y={500} w={200} h={150} stroke={C.green} strokeWidth={4} delay={sec(0.4) + i * 8} seed={3 + i} />
      ))}
      {/* the payoff stamp — rotated, slams from 1.6× to 1× */}
      <div style={{ position: "absolute", left: 0, top: 780, width: W, textAlign: "center", transform: `rotate(-8deg) scale(${stamp})`, opacity: stampOp }}>
        <div style={{ display: "inline-block", border: `6px solid ${C.green}`, borderRadius: 16, padding: "14px 40px", fontFamily: KALAM, fontWeight: 700, fontSize: 64, color: C.green }}>
          SCALED
        </div>
      </div>
    </>
  );
};

export const ExampleVideo: React.FC = () => {
  // Board windows come from the REAL transcript word times (rules/pipeline.md).
  const w = {
    b1: [sec(0), sec(5)],
    b2: [sec(5), sec(12)],
    b3: [sec(12), EXAMPLE_DURATION],
  } as const;

  return (
    <AbsoluteFill style={{ background: SLATE_DEEP }}>
      <ChalkBg />
      {/* the raw clip IS the voice track */}
      <Audio src={staticFile("raw/clip.mov")} />

      {/* SFX beats: ~2 per board, quiet, scene-matched */}
      <Sfx at={w.b1[0] + sec(0.8)} name="chalk-draw" />
      <Sfx at={w.b1[0] + sec(1.6)} name="chalk-arrow" />
      <Sfx at={w.b2[0] + sec(0.5)} name="chalk-write" />
      <Sfx at={w.b2[0] + sec(5.2)} name="impact-thud" volume={0.4} />
      <Sfx at={w.b3[0] + sec(0.4)} name="pop-soft" />
      <Sfx at={w.b3[0] + sec(2)} name="ding-soft" />

      <Board from={w.b1[0]} to={w.b1[1]}>
        <B1Setup />
      </Board>
      <Board from={w.b2[0]} to={w.b2[1]}>
        <B2Crash />
      </Board>
      <Board from={w.b3[0]} to={w.b3[1]}>
        <B3Fix />
      </Board>

      <KaraokeCaptions chunks={SAMPLE_CHUNKS} color={CHALK} activeColor={C.amber} bottom={470} size={54} />
    </AbsoluteFill>
  );
};
