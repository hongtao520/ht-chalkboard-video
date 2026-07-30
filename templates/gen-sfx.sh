#!/bin/zsh
# Synthesize SFX from pure math — no downloads, no licensing.
# Every sound is an ffmpeg lavfi expression: sine waves, noise, and envelopes.
# Output: public/sfx/gen/*.mp3   (regenerate any time; fully deterministic)
set -e
cd "$(dirname "$0")/.."
mkdir -p public/sfx/gen

# 1. WHOOSH — pink noise swept through a falling lowpass, faded in/out
ffmpeg -y -v error -f lavfi -i "anoisesrc=color=pink:duration=0.9:seed=7" \
  -af "lowpass=f=1400,afade=t=in:d=0.30,afade=t=out:st=0.40:d=0.50,volume=2.0" \
  public/sfx/gen/whoosh.mp3

# 2. RISER — a sine whose frequency accelerates upward (tension build)
ffmpeg -y -v error -f lavfi -i "aevalsrc=0.5*sin(2*PI*(180+900*t*t)*t):d=1.1:s=44100" \
  -af "afade=t=in:d=0.15,afade=t=out:st=0.85:d=0.25" \
  public/sfx/gen/riser.mp3

# 3. BOOM — 55 Hz sine thump + a short noise burst, fast exponential decay
ffmpeg -y -v error \
  -f lavfi -i "aevalsrc=0.9*sin(2*PI*55*t)*exp(-6*t):d=1.0:s=44100" \
  -f lavfi -i "anoisesrc=color=brown:duration=0.25:seed=3" \
  -filter_complex "[1]volume=0.5,afade=t=out:d=0.22[n];[0][n]amix=inputs=2:duration=first,volume=2.2" \
  public/sfx/gen/boom.mp3

# 4. SPARKLE — two detuned high sines with a fast decay (magic "ding")
ffmpeg -y -v error \
  -f lavfi -i "aevalsrc=0.4*(sin(2*PI*1318*t)+0.6*sin(2*PI*1976*t))*exp(-5*t):d=0.9:s=44100" \
  public/sfx/gen/sparkle.mp3

# 5. FOOTSTEP — a tiny filtered noise tap (loopable for walk cycles)
ffmpeg -y -v error -f lavfi -i "anoisesrc=color=brown:duration=0.12:seed=11" \
  -af "lowpass=f=500,afade=t=out:st=0.03:d=0.09,volume=1.6" \
  public/sfx/gen/footstep.mp3

echo "generated:" && ls public/sfx/gen
