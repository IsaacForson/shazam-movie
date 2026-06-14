"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface LinkSectionProps {
  onTranscriptReady: (text: string) => void;
  isSearching: boolean;
}

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

      if (!res.ok) {
        throw new Error(data.error || "Failed to process link");
      }

      setTranscript(data.transcript);
      setStatus("done");
      onTranscriptReady(data.transcript);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to process link");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <p className="text-gray-300 font-medium mb-1">Paste a video link</p>
          <p className="text-gray-500 text-sm">
            YouTube, TikTok, Instagram Reels, Twitter/X, Facebook
          </p>
        </div>

        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={!url.trim() || status === "loading" || isSearching}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-indigo-500 transition-all"
        >
          {status === "loading" ? "Extracting & transcribing..." : "Identify Movie"}
        </button>

        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Downloading audio and transcribing...</span>
          </motion.div>
        )}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {transcript && status === "done" && (
          <div className="bg-gray-800/40 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Transcript</p>
            <p className="text-gray-200 text-sm">{transcript}</p>
          </div>
        )}
      </div>
    </div>
  );
}
