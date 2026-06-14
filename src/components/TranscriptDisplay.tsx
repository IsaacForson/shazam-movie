"use client";

import { motion } from "framer-motion";

interface TranscriptDisplayProps {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
}

export default function TranscriptDisplay({
  transcript,
  interimTranscript,
  isListening,
}: TranscriptDisplayProps) {
  const hasContent = transcript || interimTranscript;

  if (!hasContent && !isListening) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl"
    >
      <div className="border-l-2 border-accent pl-4 py-1">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isListening ? "bg-accent animate-pulse" : "bg-line-strong"
            }`}
          />
          <span className="label text-soft">
            {isListening ? "Hearing" : "Heard"}
          </span>
        </div>
        <p className="font-serif text-xl text-ink leading-snug min-h-8">
          {transcript}
          {interimTranscript && <span className="text-soft italic"> {interimTranscript}</span>}
          {isListening && !hasContent && (
            <span className="text-soft/70 italic">Play a clip near your microphone…</span>
          )}
        </p>
      </div>
    </motion.div>
  );
}
