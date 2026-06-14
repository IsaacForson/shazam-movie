"use client";

import { motion } from "framer-motion";
import { AppMode } from "@/types";

interface ModeSelectorProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

const modes: { key: AppMode; index: string; label: string }[] = [
  { key: "listen", index: "01", label: "Listen" },
  { key: "upload", index: "02", label: "Upload" },
  { key: "link", index: "03", label: "Link" },
  { key: "type", index: "04", label: "Type" },
];

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-line">
      {modes.map(({ key, index, label }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="relative text-left py-5 pr-4 border-b sm:border-b-0 border-line group cursor-pointer"
          >
            {active && (
              <motion.span
                layoutId="modeUnderline"
                className="absolute -top-px left-0 right-0 h-0.5 bg-accent"
                transition={{ type: "spring", damping: 30, stiffness: 320 }}
              />
            )}
            <span
              className={`font-mono text-xs ${
                active ? "text-accent" : "text-soft"
              }`}
            >
              {index}
            </span>
            <span
              className={`block font-serif text-2xl mt-1 transition-colors ${
                active ? "text-ink" : "text-soft group-hover:text-ink"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
