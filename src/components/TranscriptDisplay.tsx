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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto"
    >
      <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${isListening ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
          <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
            {isListening ? "Listening..." : "Transcript"}
          </span>
        </div>
        <p className="text-gray-200 text-sm leading-relaxed min-h-[2rem]">
          {transcript}
          {interimTranscript && (
            <span className="text-gray-500 italic">{interimTranscript}</span>
          )}
          {isListening && !hasContent && (
            <span className="text-gray-600 italic">
              Speak or play a movie clip near your microphone...
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
}
