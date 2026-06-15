const MAX_FILE_SIZE = 25 * 1024 * 1024;

export class TranscribeError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Sends audio to a Whisper-compatible endpoint (Groq by default, OpenAI if its
 * key is set) and returns the transcript. Shared by /api/transcribe and the
 * Link pipeline so there's a single source of truth.
 */
export async function transcribeAudio(audio: Blob, filename = "audio.mp3"): Promise<string> {
  if (audio.size === 0) {
    throw new TranscribeError("No audio captured", 422);
  }
  if (audio.size > MAX_FILE_SIZE) {
    throw new TranscribeError("Clip is too large (max 25MB). Try a shorter clip.", 400);
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new TranscribeError("Transcription service not configured", 503);
  }

  const useGroq = !!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY;
  const endpoint = useGroq
    ? "https://api.groq.com/openai/v1/audio/transcriptions"
    : "https://api.openai.com/v1/audio/transcriptions";

  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", useGroq ? "whisper-large-v3" : "whisper-1");
  form.append("language", "en");
  form.append("response_format", "json");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    console.error("Whisper error:", await res.text());
    throw new TranscribeError("Transcription failed", 502);
  }

  const data = await res.json();
  const transcript = (data.text as string)?.trim() || "";

  if (!transcript) {
    throw new TranscribeError("No speech detected in audio", 422);
  }

  return transcript;
}
