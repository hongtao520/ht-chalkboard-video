# Narration voice

Use this Fish Audio default unless the user selects another Fish voice:

```json
{
  "provider": "fish",
  "model": "s2.1-pro-free",
  "name": "短视频知识男声",
  "reference_id": "4e6384a9da6c4d7088e85ea163d6d1de",
  "speed": 1.0,
  "temperature": 0.65,
  "top_p": 0.7,
  "trim_silence": true
}
```

Read credentials only from `FISH_API_KEY` or this skill's `.env`.
Treat `ht-chalkboard-video/.env` as the persisted source of truth.
Never store credentials in project JSON, source files, logs, or generated
skills.

Fish WAV output uses 44.1 kHz. Normalize delivery narration to 48 kHz. For a
voice-only replacement, trim only file-edge silence. Do not remove internal
pauses, alter pitch, change playback speed, or duration-fit the voice. Rebuild
the video timeline from the regenerated narration timestamps instead.
