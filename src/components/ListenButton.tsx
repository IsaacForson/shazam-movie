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
            <motion.div
              className="absolute inset-0 rounded-full bg-purple-500/20"
              animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-purple-500/15"
              animate={{ scale: [1, 2.2, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-purple-500/10"
              animate={{ scale: [1, 2.6, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            />
          </>
        )}
        <motion.button
          onClick={onClick}
          whileTap={{ scale: 0.95 }}
          className={`relative z-10 w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 ${
            isListening
              ? "bg-gradient-to-br from-purple-600 to-pink-600 shadow-[0_0_60px_rgba(168,85,247,0.5)]"
              : "bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
          }`}
        >
          {isListening ? (
            <motion.div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-white rounded-full"
                  animate={{
                    height: [12, 28, 12],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <svg
              className="w-14 h-14 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </motion.button>
      </div>
      <p className="text-gray-400 text-sm">
        {isListening ? "Listening... tap to stop" : "Tap to start listening"}
      </p>
    </div>
  );
}
