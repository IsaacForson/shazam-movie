import { NextRequest, NextResponse } from "next/server";

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
    if (!workerUrl) {
      return NextResponse.json(
        { error: "Media worker not configured. Set MEDIA_WORKER_URL." },
        { status: 503 }
      );
    }

    const extractRes = await fetch(`${workerUrl}/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(65000),
    });

    if (!extractRes.ok) {
      const err = await extractRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || "Failed to extract audio from URL" },
        { status: 502 }
      );
    }

    const audioBlob = await extractRes.blob();

    const whisperForm = new FormData();
    whisperForm.append("audio", audioBlob, "audio.mp3");

    const origin = request.nextUrl.origin;
    const transcribeRes = await fetch(`${origin}/api/transcribe`, {
      method: "POST",
      body: whisperForm,
    });

    if (!transcribeRes.ok) {
      const err = await transcribeRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error || "Transcription failed" },
        { status: transcribeRes.status }
      );
    }

    const { transcript } = await transcribeRes.json();
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Resolve URL error:", error);
    return NextResponse.json({ error: "Failed to process URL" }, { status: 500 });
  }
}
