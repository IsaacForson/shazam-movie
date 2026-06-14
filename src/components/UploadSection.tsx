"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { extractAudioFromFile } from "@/lib/extract-audio";

type TranscribeStatus = "idle" | "extracting" | "transcribing" | "done" | "error";

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
    setStatus("extracting");
    setStatusMessage("Extracting audio from clip...");
    setError(null);
    setTranscript("");

    try {
      const audioBlob = await extractAudioFromFile(f, (msg) => {
        if (msg.includes("time=")) setStatusMessage("Extracting audio...");
      });

      setStatus("transcribing");
      setStatusMessage("Transcribing speech...");

      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.mp3");

      const res = await fetch("/api/transcribe", { method: "POST", body: formData });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Transcription failed");
      }

      const data = await res.json();
      setTranscript(data.transcript);
      setManualText(data.transcript);
      setStatus("done");
      setStatusMessage("");
      onTranscriptReady(data.transcript);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Transcription failed. Type dialogue manually.");
      setStatusMessage("");
    }
  };

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/") && !f.type.startsWith("audio/")) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setVideoUrl(url);
    transcribeFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleManualSearch = () => {
    if (manualText.trim().length > 2) {
      onTranscriptReady(manualText.trim());
    }
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

  const isProcessing = status === "extracting" || status === "transcribing";

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-purple-500 bg-purple-500/10"
              : "border-gray-700 hover:border-gray-600 bg-gray-900/40"
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
          <svg
            className="w-12 h-12 mx-auto text-gray-500 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-gray-300 font-medium">Drop a video or audio clip here</p>
          <p className="text-gray-500 text-sm mt-1">We&apos;ll transcribe and identify automatically</p>
          <p className="text-gray-600 text-xs mt-3">Supports MP4, MOV, WebM, MP3, WAV</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {videoUrl && file.type.startsWith("video/") && (
            <div className="rounded-xl overflow-hidden bg-black">
              <video ref={videoRef} src={videoUrl} controls className="w-full max-h-64" />
            </div>
          )}

          <div className="flex items-center justify-between bg-gray-900/60 rounded-lg p-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <svg className="w-5 h-5 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <span className="text-sm text-gray-300 truncate">{file.name}</span>
            </div>
            <button onClick={clearFile} className="text-gray-500 hover:text-gray-300 shrink-0 ml-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-purple-300 text-sm">{statusMessage}</span>
            </div>
          )}

          {transcript && status === "done" && (
            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">Transcript</p>
              <p className="text-gray-200 text-sm">{transcript}</p>
            </div>
          )}

          {error && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
              <p className="text-yellow-400 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
            <p className="text-gray-400 text-sm">
              {error ? "Type the dialogue manually as a fallback:" : "Edit transcript or type dialogue:"}
            </p>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Type the dialogue you hear..."
              className="w-full bg-gray-800/60 border border-gray-700 rounded-lg p-3 text-gray-200 text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
              rows={3}
            />
            <button
              onClick={handleManualSearch}
              disabled={manualText.trim().length < 3 || isSearching || isProcessing}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-indigo-500 transition-all"
            >
              {isSearching ? "Searching..." : "Identify Movie"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
