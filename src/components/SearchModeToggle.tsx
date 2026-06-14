"use client";

import { motion } from "framer-motion";

export type SearchMode = "quote" | "describe";

interface SearchModeToggleProps {
  value: SearchMode;
  onChange: (mode: SearchMode) => void;
}

const options: { key: SearchMode; label: string; hint: string }[] = [
  { key: "quote", label: "Quoting a line", hint: "Exact words from the film" },
  { key: "describe", label: "Describing it", hint: "The plot or scene, in your words" },
];

export default function SearchModeToggle({ value, onChange }: SearchModeToggleProps) {
  return (
    <div className="mb-7">
      <p className="label text-soft mb-2">What have you got?</p>
      <div className="inline-flex border border-line-strong bg-card">
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => onChange(opt.key)}
              className="relative px-4 py-2.5 text-sm cursor-pointer transition-colors"
            >
              {active && (
                <motion.span
                  layoutId="searchModeBg"
                  className="absolute inset-0 bg-ink"
                  transition={{ type: "spring", damping: 30, stiffness: 320 }}
                />
              )}
              <span
                className={`relative z-10 font-medium ${
                  active ? "text-paper" : "text-soft hover:text-ink"
                }`}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-soft mt-2">
        {options.find((o) => o.key === value)?.hint}
      </p>
    </div>
  );
}
