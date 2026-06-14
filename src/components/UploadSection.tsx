"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";

type TranscribeStatus = "idle" | "transcribing" | "done" | "error";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

interface UploadSectionProps {
  onTranscriptReady: (text: string) => void;
  isSearching: boolean;
}

export default function UploadSection({ onTranscriptReady, isSearching }: UploadSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<TranscribeStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const transcribeFile = async (f: File) => {
    setStatus("transcribing");
    setStatusMessage("Transcribing the dialogue…");
    setError(null);
    setTranscript("");

    try {
      const formData = new FormData();
      formData.append("audio", f, f.name);

      const res = await fetch("/api/transcribe", { method: "POST", body: formData });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't transcribe. Type the line below.");
      }

      const data = await res.json();
      setTranscript(data.transcript);
      setManualText(data.transcript);
      setStatus("done");
      setStatusMessage("");
      onTranscriptReady(data.transcript);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't transcribe. Type the line below.");
      setStatusMessage("");
    }
  };

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/") && !f.type.startsWith("audio/")) return;
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    if (f.size > MAX_FILE_SIZE) {
      setStatus("error");
      setError("Clip is too large (max 25MB). Trim it shorter, or type the line below.");
      return;
    }
    transcribeFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleManualSearch = () => {
    if (manualText.trim().length > 2) onTranscriptReady(manualText.trim());
  };

  const clearFile = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(null);
    setVideoUrl(null);
    setManualText("");
    setTranscript("");
    setStatus("idle");
    setError(null);
    setStatusMessage("");
  };

  const isProcessing = status === "transcribing";

  return (
    <div className="w-full space-y-5">
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-accent bg-accent-soft/40"
              : "border-line-strong bg-card hover:border-accent"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <svg className="w-10 h-10 mx-auto text-soft mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="font-serif text-xl text-ink">Drop a clip here</p>
          <p className="text-soft text-sm mt-1">or click to browse — we transcribe it automatically</p>
          <p className="label text-soft/70 mt-4">MP4 · MOV · WEBM · MP3 · WAV</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {videoUrl && file.type.startsWith("video/") && (
            <div className="overflow-hidden border border-line bg-ink">
              <video ref={videoRef} src={videoUrl} controls className="w-full max-h-72" />
            </div>
          )}

          <div className="flex items-center justify-between border border-line bg-card px-4 py-3">
            <span className="text-sm text-ink truncate">{file.name}</span>
            <button onClick={clearFile} className="text-soft hover:text-accent shrink-0 ml-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-3 border-l-2 border-accent pl-4 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="label text-soft">{statusMessage}</span>
            </div>
          )}

          {transcript && status === "done" && (
            <div className="border-l-2 border-accent pl-4 py-1">
              <p className="label text-soft mb-1">Heard</p>
              <p className="font-serif text-lg text-ink">{transcript}</p>
            </div>
          )}

          {error && (
            <div className="border border-accent/30 bg-accent-soft/50 px-4 py-3">
              <p className="text-accent-deep text-sm">{error}</p>
            </div>
          )}

          <div className="border border-line bg-card">
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Edit the transcript, or type the line yourself…"
              className="w-full bg-transparent p-4 text-ink text-sm placeholder:text-soft/60 focus:outline-none resize-none"
              rows={3}
            />
            <div className="flex justify-end border-t border-line px-4 py-3">
              <button
                onClick={handleManualSearch}
                disabled={manualText.trim().length < 3 || isSearching || isProcessing}
                className="bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSearching ? "Searching…" : "Find the film"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
