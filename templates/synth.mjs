/* ===================================================================
 * Deterministic audio synth — SFX library + emotion BGM tracks.
 *
 *   node scripts/synth.mjs          → generates everything
 *   node scripts/synth.mjs sfx      → only the SFX library
 *   node scripts/synth.mjs music    → only the music tracks
 *
 * Everything is math: oscillators + envelopes + filtered noise +
 * a feedback delay, rendered to WAV then converted to mp3 (ffmpeg).
 * Seeded PRNG → identical output on every run.
 *
 * Output:
 *   public/sfx/gen/*.mp3      (20 SFX, prefixed by category)
 *   public/music/gen/*.mp3    (6 tracks ≈ 60s, one per emotion)
 * =================================================================== */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SR = 44100;
const TAU = Math.PI * 2;

/* ------------------------------------------------------- utils */
const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const makeBuf = (sec) => {
  const n = Math.ceil(sec * SR);
  return { L: new Float64Array(n), R: new Float64Array(n), n };
};

const midi = (m) => 440 * 2 ** ((m - 69) / 12);

/** additive tone. decay>0 = pluck (exp decay over dur); else ADSR-ish. */
function tone(b, { at, dur, freq, amp = 0.2, type = "sine", attack = 0.005, release = 0.08, decay = 0, harmonics = [1], slide = 0, pan = 0, lp = 0, vibrato = 0, vibRate = 5 }) {
  const start = Math.floor(at * SR);
  const N = Math.floor((dur + (decay ? 0 : release)) * SR);
  const gl = Math.min(1, 1 - pan);
  const gr = Math.min(1, 1 + pan);
  const lpa = lp > 0 ? 1 - Math.exp((-TAU * lp) / SR) : 1;
  let phase = 0;
  let lpz = 0;
  for (let i = 0; i < N; i++) {
    const idx = start + i;
    if (idx >= b.n) break;
    const t = i / SR;
    const f = (freq + slide * t) * (1 + vibrato * Math.sin(TAU * vibRate * t));
    phase += f / SR;
    let s = 0;
    if (type === "sine") {
      for (let h = 0; h < harmonics.length; h++) s += harmonics[h] * Math.sin(TAU * phase * (h + 1));
    } else if (type === "saw") s = 2 * (phase % 1) - 1;
    else if (type === "square") s = (phase % 1) < 0.5 ? 1 : -1;
    else if (type === "triangle") s = 4 * Math.abs((phase % 1) - 0.5) - 1;
    let env;
    if (decay > 0) env = (t < attack ? t / attack : 1) * Math.exp(-decay * t);
    else if (t < attack) env = t / attack;
    else if (t < dur) env = 1;
    else env = Math.max(0, 1 - (t - dur) / release);
    if (lp > 0) {
      lpz += lpa * (s - lpz);
      s = lpz;
    }
    const v = s * amp * env;
    b.L[idx] += v * gl;
    b.R[idx] += v * gr;
  }
}

/** filtered noise burst; lp sweeps lpStart→lpEnd across dur. hp carves lows. */
function noise(b, { at, dur, amp = 0.2, lpStart = 4000, lpEnd = 4000, hp = 0, attack = 0.002, decay = 0, pan = 0, seed = 1 }) {
  const start = Math.floor(at * SR);
  const N = Math.floor(dur * SR);
  const rnd = mulberry32(seed * 7919 + 13);
  const gl = Math.min(1, 1 - pan);
  const gr = Math.min(1, 1 + pan);
  let lpz = 0;
  let hpz = 0;
  for (let i = 0; i < N; i++) {
    const idx = start + i;
    if (idx >= b.n) break;
    const t = i / SR;
    const prog = t / dur;
    const cut = lpStart + (lpEnd - lpStart) * prog;
    const lpa = 1 - Math.exp((-TAU * Math.max(40, cut)) / SR);
    let s = rnd() * 2 - 1;
    lpz += lpa * (s - lpz);
    s = lpz;
    if (hp > 0) {
      const hpa = 1 - Math.exp((-TAU * hp) / SR);
      hpz += hpa * (s - hpz);
      s -= hpz;
    }
    let env = t < attack ? t / attack : decay > 0 ? Math.exp(-decay * (t - attack)) : 1 - prog;
    const v = s * amp * env;
    b.L[idx] += v * gl;
    b.R[idx] += v * gr;
  }
}

/** stereo feedback delay (post-process) */
function echo(b, { time = 0.3, fb = 0.35, mix = 0.3, spread = 0.012 }) {
  const dl = Math.floor(time * SR);
  const dr = Math.floor((time + spread) * SR);
  for (let i = 0; i < b.n; i++) {
    if (i >= dl) b.L[i] += b.L[i - dl] * fb * mix + (mix * 0.4) * b.R[i - dl] * fb;
    if (i >= dr) b.R[i] += b.R[i - dr] * fb * mix + (mix * 0.4) * b.L[i - dr] * fb;
  }
}

function normalize(b, peak = 0.89) {
  let m = 0;
  for (let i = 0; i < b.n; i++) m = Math.max(m, Math.abs(b.L[i]), Math.abs(b.R[i]));
  if (m === 0) return;
  const g = peak / m;
  for (let i = 0; i < b.n; i++) {
    b.L[i] *= g;
    b.R[i] *= g;
  }
}

function writeMp3(b, outPath) {
  normalize(b);
  const bytes = Buffer.alloc(44 + b.n * 4);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(36 + b.n * 4, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(2, 22);
  bytes.writeUInt32LE(SR, 24);
  bytes.writeUInt32LE(SR * 4, 28);
  bytes.writeUInt16LE(4, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(b.n * 4, 40);
  for (let i = 0; i < b.n; i++) {
    bytes.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(b.L[i] * 32767))), 44 + i * 4);
    bytes.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(b.R[i] * 32767))), 46 + i * 4);
  }
  const wav = outPath.replace(/\.mp3$/, ".tmp.wav");
  writeFileSync(wav, bytes);
  execSync(`ffmpeg -y -v error -i "${wav}" -b:a 192k "${outPath}"`);
  unlinkSync(wav);
  console.log("  ✓", outPath.replace(ROOT + "/", ""));
}

/* ------------------------------------------------------- drums */
const kick = (b, at, amp = 0.5, punch = 1) =>
  tone(b, { at, dur: 0.28, freq: 120 * punch, slide: -300 * punch, amp, decay: 14, attack: 0.001 });
const snare = (b, at, amp = 0.3, seed = 2) => {
  noise(b, { at, dur: 0.16, amp, lpStart: 5200, lpEnd: 2600, hp: 300, decay: 24, seed });
  tone(b, { at, dur: 0.09, freq: 190, amp: amp * 0.6, decay: 30 });
};
const hat = (b, at, amp = 0.12, open = false, seed = 3) =>
  noise(b, { at, dur: open ? 0.22 : 0.05, amp, lpStart: 9500, lpEnd: 7000, hp: 5000, decay: open ? 16 : 60, seed });

/* ================================================================
 * SFX LIBRARY
 * ================================================================ */
const SFX_DIR = join(ROOT, "public/sfx/gen");

const SFX = {
  /* --- UI --- */
  "ui-click": (b) => {
    noise(b, { at: 0, dur: 0.03, amp: 0.5, lpStart: 6000, lpEnd: 3000, decay: 90, seed: 5 });
    tone(b, { at: 0, dur: 0.05, freq: 2100, amp: 0.25, decay: 60 });
  },
  "ui-pop": (b) => tone(b, { at: 0, dur: 0.12, freq: 430, slide: -1400, amp: 0.55, decay: 22, harmonics: [1, 0.3] }),
  "ui-success": (b) => {
    tone(b, { at: 0, dur: 0.3, freq: midi(79), amp: 0.4, decay: 9, harmonics: [1, 0.35, 0.1] });
    tone(b, { at: 0.11, dur: 0.5, freq: midi(84), amp: 0.4, decay: 7, harmonics: [1, 0.35, 0.1] });
  },
  "ui-error": (b) => {
    tone(b, { at: 0, dur: 0.16, freq: midi(64), amp: 0.4, decay: 12, type: "triangle" });
    tone(b, { at: 0.15, dur: 0.34, freq: midi(58), amp: 0.42, decay: 9, type: "triangle" });
  },
  "ui-toggle": (b) => tone(b, { at: 0, dur: 0.06, freq: 900, slide: 600, amp: 0.35, decay: 40, type: "square", lp: 2400 }),
  /* --- transitions --- */
  "trans-whoosh-soft": (b) => noise(b, { at: 0, dur: 1.0, amp: 0.6, lpStart: 300, lpEnd: 2600, decay: 2.2, attack: 0.3, seed: 11 }),
  "trans-whoosh-fast": (b) => noise(b, { at: 0, dur: 0.45, amp: 0.7, lpStart: 900, lpEnd: 4200, hp: 250, decay: 5, attack: 0.08, seed: 12 }),
  "trans-riser": (b) => {
    tone(b, { at: 0, dur: 1.4, freq: 160, slide: 620, amp: 0.3, type: "saw", lp: 1600, attack: 0.5, release: 0.15 });
    noise(b, { at: 0.2, dur: 1.2, amp: 0.35, lpStart: 500, lpEnd: 5200, attack: 0.7, seed: 13 });
  },
  "trans-downlifter": (b) => {
    tone(b, { at: 0, dur: 1.1, freq: 700, slide: -520, amp: 0.3, type: "saw", lp: 1300, attack: 0.02, release: 0.3 });
    noise(b, { at: 0, dur: 1.1, amp: 0.25, lpStart: 4200, lpEnd: 500, decay: 2.4, seed: 14 });
  },
  "trans-sub-drop": (b) => tone(b, { at: 0, dur: 1.3, freq: 130, slide: -85, amp: 0.85, decay: 2.4, attack: 0.01, harmonics: [1, 0.2] }),
  /* --- impacts --- */
  "impact-boom": (b) => {
    tone(b, { at: 0, dur: 1.2, freq: 58, slide: -18, amp: 0.9, decay: 4.5, attack: 0.002, harmonics: [1, 0.4, 0.15] });
    noise(b, { at: 0, dur: 0.3, amp: 0.4, lpStart: 900, lpEnd: 200, decay: 12, seed: 21 });
  },
  "impact-thud": (b) => {
    tone(b, { at: 0, dur: 0.22, freq: 82, slide: -60, amp: 0.8, decay: 18, attack: 0.001 });
    noise(b, { at: 0, dur: 0.06, amp: 0.3, lpStart: 700, lpEnd: 300, decay: 40, seed: 22 });
  },
  "impact-punch": (b) => {
    tone(b, { at: 0, dur: 0.14, freq: 150, slide: -220, amp: 0.7, decay: 26 });
    noise(b, { at: 0, dur: 0.12, amp: 0.55, lpStart: 3200, lpEnd: 800, decay: 30, seed: 23 });
  },
  "impact-glass": (b) => {
    const r = mulberry32(77);
    for (let i = 0; i < 7; i++)
      tone(b, { at: 0.01 + r() * 0.12, dur: 0.4, freq: 1900 + r() * 3400, amp: 0.16, decay: 10 + r() * 18, pan: r() * 1.4 - 0.7 });
  },
  /* --- tech --- */
  "tech-typing": (b) => {
    const r = mulberry32(31);
    for (let i = 0; i < 7; i++) {
      const at = i * (0.085 + r() * 0.05);
      noise(b, { at, dur: 0.03, amp: 0.4 + r() * 0.2, lpStart: 5200, lpEnd: 2400, decay: 80, seed: 40 + i });
      tone(b, { at, dur: 0.03, freq: 1400 + r() * 900, amp: 0.1, decay: 90 });
    }
  },
  "tech-beeps": (b) => [midi(76), midi(80), midi(83)].forEach((f, i) => tone(b, { at: i * 0.14, dur: 0.09, freq: f, amp: 0.3, type: "square", lp: 3200, decay: 24 })),
  "tech-data": (b) => {
    const r = mulberry32(53);
    for (let i = 0; i < 26; i++)
      tone(b, { at: r() * 0.75, dur: 0.03, freq: 1000 + Math.floor(r() * 7) * 320, amp: 0.14, type: "square", lp: 4200, decay: 60, pan: r() * 1.2 - 0.6 });
  },
  "tech-glitch": (b) => {
    const r = mulberry32(97);
    for (let i = 0; i < 9; i++) {
      const at = r() * 0.4;
      tone(b, { at, dur: 0.02 + r() * 0.05, freq: 180 + r() * 1600, amp: 0.3, type: "square", lp: 2600 });
      if (r() > 0.5) noise(b, { at: at + 0.01, dur: 0.03, amp: 0.25, lpStart: 3600, lpEnd: 3600, decay: 40, seed: 60 + i });
    }
  },
  "tech-notify": (b) => {
    tone(b, { at: 0, dur: 0.4, freq: midi(88), amp: 0.35, decay: 8, harmonics: [1, 0.4, 0.12] });
    tone(b, { at: 0.13, dur: 0.6, freq: midi(93), amp: 0.32, decay: 6, harmonics: [1, 0.4, 0.12] });
    echo(b, { time: 0.19, fb: 0.3, mix: 0.35 });
  },
  "tech-scan": (b) => tone(b, { at: 0, dur: 0.8, freq: 500, slide: 900, amp: 0.28, vibrato: 0.04, vibRate: 22, lp: 3600, attack: 0.05, release: 0.2 }),

  // ---- chalkboard palette (the default video SFX — see Sfx.tsx) ----
  "chalk-draw": (b) => {
    // one long stroke: band-passed noise with a hand-pressure envelope
    noise(b, { at: 0, dur: 0.55, amp: 0.5, lpStart: 2400, lpEnd: 1400, hp: 700, attack: 0.04, seed: 21 });
    noise(b, { at: 0.1, dur: 0.35, amp: 0.3, lpStart: 3200, lpEnd: 2000, hp: 900, attack: 0.03, seed: 22 });
  },
  "chalk-arrow": (b) => {
    // quick stroke + a shorter flick for the arrowhead
    noise(b, { at: 0, dur: 0.28, amp: 0.5, lpStart: 2600, lpEnd: 1600, hp: 800, attack: 0.02, seed: 23 });
    noise(b, { at: 0.3, dur: 0.12, amp: 0.4, lpStart: 3000, lpEnd: 2200, hp: 900, attack: 0.01, seed: 24 });
  },
  "chalk-write": (b) => {
    // handwriting: a run of short scratchy ticks
    const r = mulberry32(31);
    let t = 0;
    for (let i = 0; i < 11 && t < 0.85; i++) {
      noise(b, { at: t, dur: 0.05 + r() * 0.05, amp: 0.3 + r() * 0.2, lpStart: 2200 + r() * 1400, lpEnd: 1500, hp: 700, attack: 0.004, decay: 30, seed: 40 + i });
      t += 0.06 + r() * 0.06;
    }
  },
  "pop-soft": (b) => tone(b, { at: 0, dur: 0.14, freq: 520, slide: -900, amp: 0.5, decay: 26, harmonics: [1, 0.25], lp: 2400 }),
  "ding-soft": (b) => tone(b, { at: 0, dur: 0.8, freq: 1318, amp: 0.32, decay: 6, harmonics: [1, 0, 0.3], attack: 0.002 }),
  "whoosh-short": (b) => noise(b, { at: 0, dur: 0.5, amp: 0.6, lpStart: 500, lpEnd: 2800, hp: 200, decay: 4, attack: 0.12, seed: 25 }),
  "gear-whir": (b) => tone(b, { at: 0, dur: 0.55, freq: 95, amp: 0.35, type: "square", lp: 900, vibrato: 0.25, vibRate: 26, attack: 0.03, release: 0.15 }),
  "zip-close": (b) => noise(b, { at: 0, dur: 0.22, amp: 0.6, lpStart: 1200, lpEnd: 5200, hp: 500, attack: 0.01, seed: 26 }),
  sparkle: (b) => {
    tone(b, { at: 0, dur: 0.7, freq: 1318, amp: 0.3, decay: 5, harmonics: [1, 0.6] });
    tone(b, { at: 0.03, dur: 0.7, freq: 1976, amp: 0.2, decay: 6 });
  },
  footstep: (b) => noise(b, { at: 0, dur: 0.12, amp: 0.55, lpStart: 520, lpEnd: 380, attack: 0.003, decay: 32, seed: 27 }),
};

const SFX_LEN = { "trans-whoosh-soft": 1.4, "trans-riser": 1.8, "trans-downlifter": 1.5, "trans-sub-drop": 1.6, "impact-boom": 1.6, "impact-glass": 1.2, "tech-typing": 1.0, "tech-notify": 1.4 };

function genSfx() {
  mkdirSync(SFX_DIR, { recursive: true });
  console.log("SFX library →", "public/sfx/gen/");
  for (const [name, fn] of Object.entries(SFX)) {
    const b = makeBuf(SFX_LEN[name] ?? 0.9);
    fn(b);
    writeMp3(b, join(SFX_DIR, `${name}.mp3`));
  }
}

/* ================================================================
 * MUSIC — six ~60s emotion beds
 * ================================================================ */
const MUSIC_DIR = join(ROOT, "public/music/gen");

/** tiny sequencer context */
const seqCtx = (bpm, bars, beatsPerBar = 4) => {
  const spb = 60 / bpm;
  const total = bars * beatsPerBar * spb + 2.5; // tail for release/echo
  return { b: makeBuf(total), spb, bars, beatsPerBar, t: (bar, beat) => (bar * beatsPerBar + beat) * spb };
};

const pluck = (b, at, m, amp = 0.24, pan = 0) => tone(b, { at, dur: 0.9, freq: midi(m), amp, decay: 5.5, harmonics: [1, 0.45, 0.12, 0.05], pan });
const bell = (b, at, m, amp = 0.2, pan = 0) => tone(b, { at, dur: 2.4, freq: midi(m), amp, decay: 2.1, harmonics: [1, 0, 0.35, 0, 0.08], pan });
const padNote = (b, at, dur, m, amp = 0.05) => {
  tone(b, { at, dur, freq: midi(m), amp, type: "saw", lp: 750, attack: Math.min(1.4, dur * 0.4), release: 1.2, detune: 0.004, pan: -0.25 });
  tone(b, { at, dur, freq: midi(m), amp, type: "saw", lp: 750, attack: Math.min(1.4, dur * 0.4), release: 1.2, detune: -0.004, pan: 0.25 });
};
const bassNote = (b, at, dur, m, amp = 0.3, lp = 380) => tone(b, { at, dur, freq: midi(m), amp, type: "saw", lp, attack: 0.01, release: 0.08, harmonics: [1] });

/** 1 · CURIOUS — playful marimba pentatonic, light shaker. For explaining. */
function musicCurious() {
  const { b, spb, bars, t } = seqCtx(96, 24);
  const r = mulberry32(101);
  const scale = [60, 62, 64, 67, 69, 72, 74, 76]; // C maj pentatonic-ish
  const roots = [48, 45, 53, 55]; // C A F G
  for (let bar = 0; bar < bars; bar++) {
    const root = roots[bar % 4];
    bassNote(b, t(bar, 0), spb * 1.6, root, 0.22);
    bassNote(b, t(bar, 2), spb * 1.4, root + (bar % 2 ? 7 : 0), 0.18);
    // melody: 2–4 seeded pentatonic plucks per bar
    const hits = 2 + Math.floor(r() * 3);
    for (let h = 0; h < hits; h++) {
      const beat = Math.floor(r() * 8) / 2;
      pluck(b, t(bar, beat), scale[Math.floor(r() * scale.length)], 0.2 + r() * 0.1, r() * 0.9 - 0.45);
    }
    // shaker 8ths
    for (let e = 0; e < 8; e++) hat(b, t(bar, e / 2), e % 2 ? 0.05 : 0.085, false, 300 + bar * 8 + e);
    if (bar % 2 === 1) kick(b, t(bar, 0), 0.3, 0.8);
  }
  echo(b, { time: (spb * 3) / 4, fb: 0.3, mix: 0.25 });
  writeMp3(b, join(MUSIC_DIR, "curious.mp3"));
}

/** 2 · FOCUS — lofi calm: warm pads, rhodes chords, dusty crackle. For deep-dives. */
function musicFocus() {
  const { b, spb, bars, t } = seqCtx(74, 18);
  const r = mulberry32(202);
  const chords = [
    [57, 60, 64, 67], // Am7
    [53, 57, 60, 64], // Fmaj7
    [55, 59, 62, 65], // G7
    [48, 52, 55, 59], // Cmaj7
  ];
  for (let bar = 0; bar < bars; bar++) {
    const ch = chords[bar % 4];
    ch.forEach((m) => padNote(b, t(bar, 0), spb * 4.2, m, 0.035));
    // rhodes stabs on the off-beats, slightly humanized
    [1, 2.5].forEach((beat) => ch.slice(1).forEach((m, i) => tone(b, { at: t(bar, beat) + r() * 0.03, dur: 1.1, freq: midi(m + 12), amp: 0.085, decay: 3.2, harmonics: [1, 0.2, 0.05], vibrato: 0.006, vibRate: 5.4, pan: i * 0.3 - 0.3 })));
    bassNote(b, t(bar, 0), spb * 3.6, ch[0] - 12, 0.26, 300);
    kick(b, t(bar, 0), 0.34, 0.7);
    kick(b, t(bar, 2.5), 0.22, 0.7);
    snare(b, t(bar, 1), 0.16, 500 + bar);
    snare(b, t(bar, 3), 0.18, 600 + bar);
    for (let e = 0; e < 4; e++) hat(b, t(bar, e) + spb * 0.5, 0.05, false, 700 + bar * 4 + e);
  }
  // vinyl crackle
  for (let i = 0; i < 320; i++) noise(b, { at: r() * (bars * 4 * spb), dur: 0.012, amp: 0.05 + r() * 0.05, lpStart: 4600, lpEnd: 4600, decay: 120, seed: 900 + i, pan: r() - 0.5 });
  echo(b, { time: spb, fb: 0.25, mix: 0.2 });
  writeMp3(b, join(MUSIC_DIR, "focus.mp3"));
}

/** 3 · EPIC — cinematic build: drone, pulsing bass, fifth pads, taiko. For missions/trailers. */
function musicEpic() {
  const { b, spb, bars, t } = seqCtx(100, 26);
  for (let bar = 0; bar < bars; bar++) {
    const grow = Math.min(1, bar / 18); // the whole track is one build
    tone(b, { at: t(bar, 0), dur: spb * 4.4, freq: midi(33), amp: 0.12 + grow * 0.06, type: "saw", lp: 220, attack: 0.4, release: 0.6 }); // A1 drone
    for (let e = 0; e < 8; e++) bassNote(b, t(bar, e / 2), spb * 0.42, 45 + (e % 4 === 3 ? 3 : 0), 0.1 + grow * 0.16, 300 + grow * 500); // pulsing 8ths
    if (bar >= 4) [57, 64].forEach((m) => padNote(b, t(bar, 0), spb * 4.4, m, 0.03 + grow * 0.035)); // open fifths
    if (bar >= 8 && bar % 2 === 0) [69, 72, 76].forEach((m, i) => tone(b, { at: t(bar, i), dur: spb * 1.4, freq: midi(m), amp: 0.09 * grow, type: "triangle", attack: 0.05, release: 0.5, pan: i * 0.4 - 0.4 }));
    kick(b, t(bar, 0), 0.4 + grow * 0.25, 1.2); // taiko
    if (bar >= 10) kick(b, t(bar, 2), 0.3 + grow * 0.2, 1.2);
    if (bar >= 18) {
      kick(b, t(bar, 1), 0.3, 1.1);
      kick(b, t(bar, 3), 0.35, 1.1);
      snare(b, t(bar, 2), 0.22, 40 + bar);
    }
    if (bar === 22) noise(b, { at: t(bar, 0), dur: spb * 8, amp: 0.3, lpStart: 400, lpEnd: 6400, attack: spb * 6, seed: 55 }); // final riser
  }
  // closing hit
  const end = t(25, 0);
  tone(b, { at: end, dur: 1.6, freq: 55, slide: -14, amp: 0.8, decay: 3.4, harmonics: [1, 0.4] });
  writeMp3(b, join(MUSIC_DIR, "epic.mp3"));
}

/** 4 · TENSION — dark ostinato 16ths, ticking hats, heartbeat. For problems/conflicts. */
function musicTension() {
  const { b, spb, bars, t } = seqCtx(120, 30);
  const r = mulberry32(404);
  const ost = [52, 55, 52, 58, 52, 55, 52, 59]; // Em cell with a b5 lean
  for (let bar = 0; bar < bars; bar++) {
    const heat = Math.min(1, bar / 22);
    for (let s = 0; s < 16; s++) {
      const m = ost[s % 8] + (bar % 8 === 7 && s > 11 ? 1 : 0);
      tone(b, { at: t(bar, s / 4), dur: 0.12, freq: midi(m), amp: 0.1 + heat * 0.08, type: "saw", lp: 900 + heat * 1600, decay: 16, pan: (s % 2) * 0.5 - 0.25 });
    }
    bassNote(b, t(bar, 0), spb * 3.8, 28, 0.3, 260); // E1 pedal
    // heartbeat
    kick(b, t(bar, 0), 0.4, 0.9);
    kick(b, t(bar, 0.75), 0.24, 0.9);
    // ticking
    for (let e = 0; e < 8; e++) hat(b, t(bar, e / 2), e % 2 ? 0.04 : 0.09, false, 1100 + bar * 8 + e);
    if (bar >= 12 && bar % 4 === 3) tone(b, { at: t(bar, 3), dur: 0.5, freq: midi(65), amp: 0.12, type: "saw", lp: 1400, decay: 5, detune: 0.012 }); // dissonant stab
    if (bar >= 20) snare(b, t(bar, 3.75), 0.12, 70 + bar);
  }
  echo(b, { time: spb * 0.75, fb: 0.3, mix: 0.16 });
  writeMp3(b, join(MUSIC_DIR, "tension.mp3"));
}

/** 5 · TRIUMPH — bright four-chord anthem, driving beat. For solutions/wins. */
function musicTriumph() {
  const { b, spb, bars, t } = seqCtx(112, 24);
  const chords = [
    [48, 55, 60, 64], // C
    [43, 55, 59, 62], // G
    [45, 57, 60, 64], // Am
    [41, 53, 57, 60], // F
  ];
  const melo = [76, 74, 72, 74, 76, 79, 76, 72];
  for (let bar = 0; bar < bars; bar++) {
    const ch = chords[bar % 4];
    const lift = bar >= 8 ? 1 : 0.6;
    ch.forEach((m) => padNote(b, t(bar, 0), spb * 4.2, m + 12, 0.032 * lift));
    // arp 8ths through the chord
    for (let e = 0; e < 8; e++) pluck(b, t(bar, e / 2), ch[e % ch.length] + 12, 0.13 * lift, (e % 4) * 0.24 - 0.36);
    bassNote(b, t(bar, 0), spb * 1.8, ch[0] - 12, 0.3);
    bassNote(b, t(bar, 2), spb * 1.8, ch[0] - 12, 0.28);
    if (bar >= 4) {
      for (let beat = 0; beat < 4; beat++) kick(b, t(bar, beat), 0.4, 1);
      snare(b, t(bar, 1), 0.2, 90 + bar);
      snare(b, t(bar, 3), 0.22, 91 + bar);
      for (let e = 0; e < 8; e++) hat(b, t(bar, e / 2 + 0.25), 0.06, e % 4 === 3, 1500 + bar * 8 + e);
    }
    if (bar >= 8 && bar % 2 === 0) {
      const m1 = melo[(bar / 2) % 8];
      tone(b, { at: t(bar, 0), dur: spb * 2.6, freq: midi(m1), amp: 0.12, type: "triangle", attack: 0.03, release: 0.5, vibrato: 0.008, vibRate: 5.5 });
    }
  }
  echo(b, { time: spb * 0.75, fb: 0.24, mix: 0.2 });
  writeMp3(b, join(MUSIC_DIR, "triumph.mp3"));
}

/** 6 · WONDER — dreamy bells over a slow pad, huge echo, no drums. For big-picture moments. */
function musicWonder() {
  const { b, spb, bars, t } = seqCtx(80, 18);
  const r = mulberry32(606);
  const chords = [
    [48, 55, 62, 67, 71], // Cmaj9
    [45, 52, 59, 64, 67], // Am9
    [53, 60, 67, 69, 76], // Fmaj9
    [43, 50, 57, 62, 66], // G6/9
  ];
  const bellScale = [72, 74, 76, 79, 81, 84, 86, 88, 91];
  for (let bar = 0; bar < bars; bar++) {
    const ch = chords[bar % 4];
    ch.forEach((m) => padNote(b, t(bar, 0), spb * 4.4, m, 0.038));
    bassNote(b, t(bar, 0), spb * 4, ch[0] - 12, 0.2, 240);
    // sparse seeded bells
    const hits = 1 + Math.floor(r() * 3);
    for (let h = 0; h < hits; h++) bell(b, t(bar, Math.floor(r() * 8) / 2), bellScale[Math.floor(r() * bellScale.length)], 0.14 + r() * 0.08, r() * 1.2 - 0.6);
    if (bar % 4 === 3) noise(b, { at: t(bar, 0), dur: spb * 4, amp: 0.06, lpStart: 300, lpEnd: 1800, attack: spb * 3, seed: 77 + bar }); // soft swell
  }
  echo(b, { time: spb * 1.5, fb: 0.45, mix: 0.4, spread: 0.03 });
  writeMp3(b, join(MUSIC_DIR, "wonder.mp3"));
}

function genMusic() {
  mkdirSync(MUSIC_DIR, { recursive: true });
  console.log("Music beds →", "public/music/gen/");
  musicCurious();
  musicFocus();
  musicEpic();
  musicTension();
  musicTriumph();
  musicWonder();
}

/* ------------------------------------------------------- main */
const mode = process.argv[2] ?? "all";
if (mode === "sfx" || mode === "all") genSfx();
if (mode === "music" || mode === "all") genMusic();
