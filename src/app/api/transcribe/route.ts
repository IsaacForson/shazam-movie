import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, TranscribeError } from "@/lib/transcribe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const filename = (audio as File).name || "audio.mp3";
    const transcript = await transcribeAudio(audio, filename);
    return NextResponse.json({ transcript });
  } catch (error) {
    if (error instanceof TranscribeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Transcribe error:", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
