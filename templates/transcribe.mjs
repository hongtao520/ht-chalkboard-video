// Transcribe a clip with whisper.cpp at TOKEN-level timestamps.
// Usage: node transcribe.mjs public/raw/clip.mov
// Output: <clip>.captions.json next to the input + a readable dump on stdout.
import path from "path";
import { execSync } from "child_process";
import { downloadWhisperModel, installWhisperCpp, transcribe, toCaptions } from "@remotion/install-whisper-cpp";
import fs from "fs";

const input = process.argv[2];
if (!input) {
  console.error("usage: node transcribe.mjs <path-to-clip>");
  process.exit(1);
}

const to = path.join(process.cwd(), "whisper.cpp");
const model = "small.en";

await installWhisperCpp({ to, version: "1.5.5" });
await downloadWhisperModel({ model, folder: to });

const wav = path.join("/tmp", path.basename(input).replace(/\.\w+$/, "") + ".wav");
execSync(`ffmpeg -i "${input}" -ar 16000 -ac 1 "${wav}" -y`, { stdio: "ignore" });

const whisperCppOutput = await transcribe({
  model,
  whisperPath: to,
  whisperCppVersion: "1.5.5",
  inputPath: wav,
  tokenLevelTimestamps: true,
});

const { captions } = toCaptions({ whisperCppOutput });
const outPath = input.replace(/\.\w+$/, "") + ".captions.json";
fs.writeFileSync(outPath, JSON.stringify(captions, null, 2));
console.log(`wrote ${outPath} (${captions.length} tokens)`);
console.log(
  captions
    .map((c) => `${(c.startMs / 1000).toFixed(2)}-${(c.endMs / 1000).toFixed(2)} ${c.text}`)
    .join(""),
);
