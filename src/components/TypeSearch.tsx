"use client";

import { useState } from "react";

interface TypeSearchProps {
  onSearch: (text: string) => void;
  isSearching: boolean;
  mode?: "quote" | "describe";
}

export default function TypeSearch({ onSearch, isSearching, mode = "quote" }: TypeSearchProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length > 2) onSearch(text.trim());
  };

  const describing = mode === "describe";

  const placeholder = describing
    ? "A man is locked in a high-tech prison and has to break out…"
    : "“Why so serious?”";

  const examples = describing
    ? [
        "A man relives the same day over and over",
        "Toys come to life when their owner leaves",
        "A team enters dreams to plant an idea",
        "A shark terrorizes a small beach town",
      ]
    : [
        "I'm gonna make him an offer he can't refuse",
        "May the force be with you",
        "You shall not pass",
        "I see dead people",
      ];

  return (
    <div className="w-full space-y-5">
      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-line-strong bg-paper-dim/60 transition-colors focus-within:border-accent">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent p-4 text-base text-ink placeholder:text-soft/70 focus:outline-none"
            rows={3}
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <span className="text-xs text-soft">{describing ? "The plot, in your words" : "Any line, any film"}</span>
            <button
              type="submit"
              disabled={text.trim().length < 3 || isSearching}
              className="bg-grad glow-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSearching ? "Searching…" : "Find film"}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            onClick={() => {
              setText(example);
              onSearch(example);
            }}
            disabled={isSearching}
            className="rounded-full border border-line bg-card/60 px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50 cursor-pointer"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
