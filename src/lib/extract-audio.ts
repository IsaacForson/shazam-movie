import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<void> | null = null;

async function getFfmpeg(): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg;

  if (!loadPromise) {
    loadPromise = (async () => {
      ffmpeg = new FFmpeg();
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
    })();
  }

  await loadPromise;
  return ffmpeg!;
}

export async function extractAudioFromFile(
  file: File,
  onProgress?: (message: string) => void
): Promise<Blob> {
  const ff = await getFfmpeg();

  ff.on("log", ({ message }) => {
    onProgress?.(message);
  });

  const inputName = "input" + getExtension(file.name);
  const outputName = "output.mp3";

  await ff.writeFile(inputName, await fetchFile(file));

  onProgress?.("Extracting audio...");

  await ff.exec([
    "-i", inputName,
    "-t", "90",
    "-vn",
    "-ac", "1",
    "-ar", "16000",
    "-b:a", "64k",
    outputName,
  ]);

  const data = await ff.readFile(outputName);
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  return new Blob([data as BlobPart], { type: "audio/mpeg" });
}

function getExtension(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext && ["mp4", "mov", "webm", "mkv", "avi", "mp3", "wav", "m4a"].includes(ext)) {
    return `.${ext}`;
  }
  return ".mp4";
}
