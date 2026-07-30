#!/usr/bin/env python3
"""Generate native-speed Fish Audio narration for HT Chalkboard Video."""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import subprocess
import tempfile
import urllib.error
import urllib.request
import wave


API_BASE = "https://api.fish.audio"
MODEL = "s2.1-pro-free"
VOICE_NAME = "短视频知识男声"
REFERENCE_ID = "4e6384a9da6c4d7088e85ea163d6d1de"
TEMPERATURE = 0.65
TOP_P = 0.7
SPEED = 1.0
EDGE_TRIM = (
    "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-42dB:"
    "start_silence=0.03,areverse,"
    "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-42dB:"
    "start_silence=0.03,areverse"
)


def load_key() -> str:
    key = os.environ.get("FISH_API_KEY", "").strip()
    if key:
        return key
    for env_path in (
        pathlib.Path(__file__).resolve().parents[1] / ".env",
    ):
        if not env_path.is_file():
            continue
        for raw in env_path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, value = line.split("=", 1)
            if name.strip() == "FISH_API_KEY":
                key = value.strip().strip("'\"")
                if key:
                    return key
    raise SystemExit(
        "Fish Audio is not configured. Run: "
        "python3 scripts/configure_fish.py"
    )


def synthesize(text: str, output: pathlib.Path) -> pathlib.Path:
    payload = json.dumps(
        {
            "text": text,
            "reference_id": REFERENCE_ID,
            "format": "wav",
            "sample_rate": 44100,
            "normalize": True,
            "latency": "normal",
            "temperature": TEMPERATURE,
            "top_p": TOP_P,
            "prosody": {"speed": SPEED, "volume": 0},
        },
        ensure_ascii=False,
    ).encode("utf-8")
    request = urllib.request.Request(
        f"{API_BASE}/v1/tts",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {load_key()}",
            "Content-Type": "application/json",
            "model": MODEL,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            audio = response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise SystemExit(f"Fish Audio TTS failed ({exc.code}): {detail}") from exc
    if not audio:
        raise SystemExit("Fish Audio returned an empty response")
    output.write_bytes(audio)
    return output


def duration(path: pathlib.Path) -> float:
    if path.suffix.lower() == ".wav":
        try:
            with wave.open(str(path), "rb") as audio:
                return audio.getnframes() / float(audio.getframerate())
        except (wave.Error, OSError, ZeroDivisionError):
            pass
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-f", "null", "-"],
        capture_output=True,
        text=True,
    )
    match = re.search(
        r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", result.stderr
    )
    if not match:
        raise SystemExit(f"Could not read audio duration: {path}")
    hours, minutes, seconds = match.groups()
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def normalize(source: pathlib.Path, output: pathlib.Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="ht-chalk-voice-") as tmp:
        trimmed = pathlib.Path(tmp) / "trimmed.wav"
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-v",
                "error",
                "-i",
                str(source),
                "-af",
                EDGE_TRIM,
                "-ar",
                "48000",
                "-ac",
                "2",
                str(trimmed),
            ],
            check=True,
        )
        command = ["ffmpeg", "-y", "-v", "error", "-i", str(trimmed)]
        if output.suffix.lower() == ".mp3":
            command += ["-c:a", "libmp3lame", "-b:a", "192k"]
        elif output.suffix.lower() == ".wav":
            command += ["-c:a", "pcm_s16le"]
        else:
            command += ["-c:a", "aac", "-b:a", "192k"]
        command.append(str(output))
        subprocess.run(command, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    text_group = parser.add_mutually_exclusive_group(required=True)
    text_group.add_argument("--text")
    text_group.add_argument("--text-file")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    text = (
        pathlib.Path(args.text_file).read_text(encoding="utf-8").strip()
        if args.text_file
        else args.text.strip()
    )
    if not text:
        raise SystemExit("Narration text is empty")
    output = pathlib.Path(args.output).expanduser().resolve()
    with tempfile.TemporaryDirectory(prefix="ht-chalk-fish-") as tmp:
        raw = pathlib.Path(tmp) / "fish.wav"
        synthesize(text, raw)
        normalize(raw, output)
    print(f"voice={VOICE_NAME}")
    print(f"model={MODEL}")
    print(f"output={output}")
    print(f"duration={duration(output):.3f}s")


if __name__ == "__main__":
    main()
