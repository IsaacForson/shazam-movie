import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { mkdtemp, readFile, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { transcribeAudio, TranscribeError } from "@/lib/transcribe";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_DOMAINS = [
  "youtube.com", "youtu.be", "tiktok.com", "instagram.com",
  "twitter.com", "x.com", "facebook.com", "fb.watch", "vm.tiktok.com",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some((d) => parsed.hostname.includes(d));
  } catch {
    return false;
  }
}

/** Extract the first 90s of audio from a URL using a local yt-dlp + ffmpeg. */
async function extractAudioLocal(url: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "reel-"));
  const outPath = join(dir, "audio.mp3");
  const bin = process.env.YTDLP_PATH || "yt-dlp";

  const args = [
    "--extract-audio",
    "--audio-format", "mp3",
    "--audio-quality", "5",
    "--postprocessor-args", "ffmpeg:-ac 1 -ar 16000",
    "--download-sections", "*0-90",
    "--max-filesize", "25M",
    "--no-playlist",
    "--no-warnings",
    "--quiet",
    "-o", outPath,
    url,
  ];

  try {
    await new Promise<void>((resolve, reject) => {
      execFile(bin, args, { timeout: 90_000, maxBuffer: 1024 * 1024 }, (err, _stdout, stderr) => {
        if (err) reject(new Error((stderr || err.message || "").slice(0, 300)));
        else resolve();
      });
    });

    try {
      return await readFile(outPath);
    } catch {
      const files = (await readdir(dir)).filter((f) => f.endsWith(".mp3"));
      if (files.length === 0) throw new Error("No audio extracted");
      return await readFile(join(dir, files[0]));
    }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Remote fallback: an external media worker that returns an mp3. */
async function extractAudioRemote(workerUrl: string, url: string): Promise<Buffer> {
  const res = await fetch(`${workerUrl}/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(95_000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to extract audio from URL");
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    if (!isAllowedUrl(url)) {
      return NextResponse.json({ error: "URL domain not supported" }, { status: 400 });
    }

    const workerUrl = process.env.MEDIA_WORKER_URL;

    let audioBuffer: Buffer;
    try {
      audioBuffer = workerUrl
        ? await extractAudioRemote(workerUrl, url)
        : await extractAudioLocal(url);
    } catch (err) {
      console.error("Audio extraction error:", err);
      return NextResponse.json(
        { error: "Couldn't pull audio from that link. Try a different one." },
        { status: 502 }
      );
    }

    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/mpeg" });
    const transcript = await transcribeAudio(audioBlob, "audio.mp3");

    return NextResponse.json({ transcript });
  } catch (error) {
    if (error instanceof TranscribeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Resolve URL error:", error);
    return NextResponse.json({ error: "Failed to process URL" }, { status: 500 });
  }
}
