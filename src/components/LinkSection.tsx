"use client";

import { useState } from "react";

interface LinkSectionProps {
  onTranscriptReady: (text: string) => void;
  isSearching: boolean;
}

const sources = ["YouTube", "TikTok", "Instagram", "Twitter / X", "Facebook"];

export default function LinkSection({ onTranscriptReady, isSearching }: LinkSectionProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setStatus("loading");
    setError(null);
    setTranscript("");

    try {
      const res = await fetch("/api/resolve-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't read that link");

      setTranscript(data.transcript);
      setStatus("done");
      onTranscriptReady(data.transcript);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't read that link");
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="border border-line-strong bg-card focus-within:border-accent transition-colors flex items-center">
        <span className="pl-4 text-soft">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.69a4.5 4.5 0 011.24 7.24l-4.5 4.5a4.5 4.5 0 01-6.36-6.36l1.76-1.76m13.35-.62l1.76-1.76a4.5 4.5 0 00-6.36-6.36l-4.5 4.5a4.5 4.5 0 001.24 7.24" />
          </svg>
        </span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a video link…"
          className="flex-1 bg-transparent px-3 py-4 text-ink placeholder:text-soft/60 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!url.trim() || status === "loading" || isSearching}
          className="self-stretch bg-ink text-paper px-5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Reading…" : "Identify"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="label text-soft">Works with</span>
        {sources.map((s) => (
          <span key={s} className="text-xs text-soft">
            {s}
          </span>
        ))}
      </div>

      {status === "loading" && (
        <div className="flex items-center gap-3 border-l-2 border-accent pl-4 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="label text-soft">Fetching audio and transcribing…</span>
        </div>
      )}

      {error && (
        <div className="border border-accent/30 bg-accent-soft/50 px-4 py-3">
          <p className="text-accent-deep text-sm">{error}</p>
        </div>
      )}

      {transcript && status === "done" && (
        <div className="border-l-2 border-accent pl-4 py-1">
          <p className="label text-soft mb-1">Heard</p>
          <p className="font-serif text-lg text-ink">{transcript}</p>
        </div>
      )}
    </div>
  );
}
