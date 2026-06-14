"use client";

import { motion } from "framer-motion";

interface ListenButtonProps {
  isListening: boolean;
  onClick: () => void;
}

export default function ListenButton({ isListening, onClick }: ListenButtonProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {isListening && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full border border-accent/40"
              animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className="absolute inset-0 rounded-full border border-accent/30"
              animate={{ scale: [1, 2.1], opacity: [0.45, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            />
          </>
        )}
        <motion.button
          onClick={onClick}
          whileTap={{ scale: 0.96 }}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center border transition-colors duration-300 ${
            isListening
              ? "bg-accent border-accent text-white"
              : "bg-card border-line-strong text-ink hover:border-accent hover:text-accent"
          }`}
        >
          {isListening ? (
            <span className="flex items-end gap-1 h-8">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 bg-white rounded-full"
                  animate={{ height: [8, 28, 8] }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                    delay: i * 0.12,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </span>
          ) : (
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </motion.button>
      </div>
      <p className="label text-soft">
        {isListening ? "Listening — tap to stop" : "Tap to listen"}
      </p>
    </div>
  );
}
